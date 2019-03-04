const Logging = require('../../../utils/Logging');
const AppError = require('../../../exception/AppError');
const AppAuthError = require('../../../exception/AppAuthError');
const Authorizations = require('../../../authorization/Authorizations');
const Constants = require('../../../utils/Constants');
const moment = require('moment');
const TransactionSecurity = require('./security/TransactionSecurity');
const TransactionStorage = require('../../../storage/mongodb/TransactionStorage');
const ChargingStation = require('../../../entity/ChargingStation');
const User = require('../../../entity/User');
const SettingStorage = require("../../../storage/mongodb/SettingStorage");
const ConcurConnector = require("../../../integration/refund/ConcurConnector");
const fs = require("fs");

class TransactionService {
  static async handleRefundTransactions(action, req, res, next) {
    try {
      // Filter
      const filteredRequest = TransactionSecurity.filterTransactionsRefund(req.body, req.user);
      if (!filteredRequest.transactionIds) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `Transaction IDs must be provided`, 500,
          'TransactionService', 'handleRefundTransactions', req.user);
      }
      const transactionsToRefund = [];
      for (const transactionId of filteredRequest.transactionIds) {
        const transaction = await TransactionStorage.getTransaction(req.user.tenantID, transactionId);
        if (!transaction) {
          Logging.logError({
            tenantID: req.user.tenantID,
            user: req.user, actionOnUser: (transaction.getUserJson() ? transaction.getUserJson() : null),
            module: 'TransactionService', method: 'handleRefundTransactions',
            message: `Transaction '${transaction.getID()}' does not exist`,
            action: action, detailedMessages: transaction.getModel()
          });
          continue;
        }
        if (transaction.isRefunded()) {
          Logging.logError({
            tenantID: req.user.tenantID,
            user: req.user, actionOnUser: (transaction.getUserJson() ? transaction.getUserJson() : null),
            module: 'TransactionService', method: 'handleRefundTransactions',
            message: `Transaction '${transaction.getID()}' is already refunded`,
            action: action, detailedMessages: transaction.getModel()
          });
          continue;
        }
        // Check auth
        if (!Authorizations.canRefundTransaction(req.user, transaction)) {
          // Not Authorized!
          throw new AppAuthError(
            Constants.ACTION_REFUND_TRANSACTION,
            Constants.ENTITY_TRANSACTION,
            transaction.getID(),
            560, 'TransactionService', 'handleRefundTransactions',
            req.user);
        }
        transactionsToRefund.push(transaction);
      }
      if (transactionsToRefund.length === 0) {
        res.json({
          ...Constants.REST_RESPONSE_SUCCESS,
          inSuccess: 0,
          inError: filteredRequest.transactionIds.length
        });
        next();
        return;
      }
      // Get Transaction User
      const user = await User.getUser(req.user.tenantID, req.user.id);
      // Check
      if (!user) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The user with ID '${req.user.id}' does not exist`, 550,
          'TransactionService', 'handleRefundTransactions', req.user);
      }
      if (!transactionsToRefund.every(tr => tr.getUserID() === req.user.id)) {
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The user with ID '${req.user.id}' cannot refund another user's transaction`, 551,
          'TransactionService', 'handleRefundTransactions', req.user);
      }
      let setting = await SettingStorage.getSettingByIdentifier(req.user.tenantID, 'chargeathome');
      setting = setting.getContent()['concur'];
      const connector = new ConcurConnector(req.user.tenantID, setting);
      const refundedTransactions = await connector.refund(user, transactionsToRefund);
      // // Transfer it to the Revenue Cloud
      // await Utils.pushTransactionToRevenueCloud(action, transaction, req.user, transaction.getUserJson());

      const response = {
        ...Constants.REST_RESPONSE_SUCCESS,
        inSuccess: refundedTransactions.length
      };
      const notRefundedTransactions = transactionsToRefund.length - refundedTransactions.length;
      if (notRefundedTransactions > 0) {
        response.inError = notRefundedTransactions;
      }
      res.json(response);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleDeleteTransaction(action, req, res, next) {
    try {
      // Filter
      const filteredRequest = TransactionSecurity.filterTransactionDelete(req.query, req.user);
      // Transaction Id is mandatory
      if (!filteredRequest.ID) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The Transaction's ID must be provided`, 500,
          'TransactionService', 'handleDeleteTransaction', req.user);
      }
      // Get Transaction
      const transaction = await TransactionStorage.getTransaction(req.user.tenantID, filteredRequest.ID);
      // Found?
      if (!transaction) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `Transaction '${filteredRequest.ID}' does not exist`, 550,
          'TransactionService', 'handleDeleteTransaction', req.user);
      }
      // Check auth
      if (!Authorizations.canDeleteTransaction(req.user, transaction)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_DELETE,
          Constants.ENTITY_TRANSACTION,
          transaction.getID(),
          560, 'TransactionService', 'handleDeleteTransaction',
          req.user);
      }
      const chargingStation = await ChargingStation.getChargingStation(req.user.tenantID, transaction.getChargeBoxID());
      if (transaction.isActive()) {
        if (!chargingStation) {
          throw new AppError(
            Constants.CENTRAL_SERVER,
            `Charging Station with ID ${transaction.getChargeBoxID()} does not exist`, 550,
            'TransactionService', 'handleDeleteTransaction', req.user);
        }
        if (transaction.getID() === chargingStation.getConnector(transaction.getConnectorId()).activeTransactionID) {
          await chargingStation.freeConnector(transaction.getConnectorId());
          await chargingStation.save();
        }
      }
      // Delete Transaction
      await chargingStation.deleteTransaction(transaction);

      // Log
      Logging.logSecurityInfo({
        tenantID: req.user.tenantID,
        user: req.user, actionOnUser: (transaction.getUserJson() ? transaction.getUserJson() : null),
        module: 'TransactionService', method: 'handleDeleteTransaction',
        message: `Transaction ID '${filteredRequest.ID}' on '${transaction.getChargeBoxID()}'-'${transaction.getConnectorId()}' has been deleted successfully`,
        action: action, detailedMessages: transaction.getModel()
      });
      // Ok
      res.json(Constants.REST_RESPONSE_SUCCESS);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleTransactionSoftStop(action, req, res, next) {
    try {
      // Filter
      const filteredRequest = TransactionSecurity.filterTransactionSoftStop(req.body, req.user);
      // Transaction Id is mandatory
      if (!filteredRequest.transactionId) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The Transaction's ID must be provided`, 500,
          'TransactionService', 'handleTransactionSoftStop', req.user);
      }
      // Get Transaction
      const transaction = await TransactionStorage.getTransaction(req.user.tenantID, filteredRequest.transactionId);
      if (!transaction) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `Transaction '${filteredRequest.transactionId}' does not exist`, 550,
          'TransactionService', 'handleTransactionSoftStop', req.user);
      }
      // Check auth
      if (!Authorizations.canUpdateTransaction(req.user, transaction)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_UPDATE,
          Constants.ENTITY_TRANSACTION,
          transaction.getID(),
          560, 'TransactionService', 'handleTransactionSoftStop',
          req.user);
      }
      // Get the Charging Station
      const chargingStation = await ChargingStation.getChargingStation(req.user.tenantID, transaction.getChargeBoxID());
      // Found?
      if (!chargingStation) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `Charging Station with ID '${transaction.getChargeBoxID()}' does not exist`, 550,
          'TransactionService', 'handleTransactionSoftStop', req.user);
      }
      // Check User
      let user;
      if (transaction.getUserID()) {
        // Get Transaction User
        const user = await User.getUser(req.user.tenantID, transaction.getUserID());
        // Check
        if (!user) {
          // Not Found!
          throw new AppError(
            Constants.CENTRAL_SERVER,
            `The user with ID '${req.user.id}' does not exist`, 550,
            'TransactionService', 'handleTransactionSoftStop', req.user);
        }
      }
      // Stop Transaction
      const stopTransaction = {};
      stopTransaction.transactionId = transaction.getID();
      stopTransaction.user = req.user.id;
      stopTransaction.idTag = req.user.tagIDs[0];
      stopTransaction.timestamp = new Date().toISOString();
      stopTransaction.meterStop = 0;
      // Save
      const result = await chargingStation.handleStopTransaction(stopTransaction, true);
      // Log
      Logging.logSecurityInfo({
        tenantID: req.user.tenantID,
        user: req.user, actionOnUser: (user ? user.getModel() : null),
        module: 'TransactionService', method: 'handleTransactionSoftStop',
        message: `Transaction ID '${transaction.getID()}' on '${transaction.getChargeBoxID()}'-'${transaction.getConnectorId()}' has been stopped successfully`,
        action: action, detailedMessages: result
      });
      // Ok
      res.json(Constants.REST_RESPONSE_SUCCESS);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleGetChargingStationConsumptionFromTransaction(action, req, res, next) {
    try {
      // Filter
      const filteredRequest = TransactionSecurity.filterChargingStationConsumptionFromTransactionRequest(req.query, req.user);
      // Transaction Id is mandatory
      if (!filteredRequest.TransactionId) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The Transaction's ID must be provided`, 500,
          'TransactionService', 'handleGetChargingStationConsumptionFromTransaction', req.user);
      }
      // Get Transaction
      const transaction = await TransactionStorage.getTransaction(req.user.tenantID, filteredRequest.TransactionId);
      if (!transaction) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `Transaction '${filteredRequest.TransactionId}' does not exist`, 550,
          'TransactionService', 'handleGetChargingStationConsumptionFromTransaction', req.user);
      }
      // Check auth
      if (!Authorizations.canReadTransaction(req.user, transaction)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_READ,
          Constants.ENTITY_TRANSACTION,
          transaction.getID(),
          560, 'TransactionService', 'handleGetChargingStationConsumptionFromTransaction',
          req.user);
      }
      // Check dates
      if (filteredRequest.StartDateTime && filteredRequest.EndDateTime && moment(filteredRequest.StartDateTime).isAfter(moment(filteredRequest.EndDateTime))) {
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The requested start date '${new Date(filteredRequest.StartDateTime).toISOString()}' is after the requested end date '${new Date(filteredRequest.StartDateTime).toISOString()}' `, 500,
          'TransactionService', 'handleGetChargingStationConsumptionFromTransaction', req.user);
      }
      // Get the consumption
      let consumptions = await transaction.getConsumptions();
      // Dates provided?
      const startDateTime = filteredRequest.StartDateTime ? filteredRequest.StartDateTime : Constants.MIN_DATE;
      const endDateTime = filteredRequest.EndDateTime ? filteredRequest.EndDateTime : Constants.MAX_DATE;
      // Filter?
      if (consumptions && (filteredRequest.StartDateTime || filteredRequest.EndDateTime)) {
        consumptions = consumptions.filter(consumption => moment(consumption.getEndedAt()).isBetween(startDateTime, endDateTime, null, '[]'));
      }
      // Return the result
      res.json(TransactionSecurity.filterConsumptionsFromTransactionResponse(transaction, consumptions, req.user));
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleGetTransaction(action, req, res, next) {
    try {
      // Filter
      const filteredRequest = TransactionSecurity.filterTransactionRequest(req.query, req.user);
      // Charge Box is mandatory
      if (!filteredRequest.ID) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The Transaction's ID must be provided`, 500,
          'TransactionService', 'handleRefundTransactions', req.user);
      }
      // Get Transaction
      const transaction = await TransactionStorage.getTransaction(req.user.tenantID, filteredRequest.ID);
      // Found?
      if (!transaction) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `Transaction '${filteredRequest.ID}' does not exist`, 550,
          'TransactionService', 'handleGetTransaction', req.user);
      }
      // Check auth
      if (!Authorizations.canReadTransaction(req.user, transaction)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_READ,
          Constants.ENTITY_TRANSACTION,
          transaction.getID(),
          560,
          'TransactionService', 'handleGetTransaction',
          req.user);
      }
      // Return
      res.json(
        // Filter
        TransactionSecurity.filterTransactionResponse(
          transaction, req.user)
      );
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleGetChargingStationTransactions(action, req, res, next) {
    try {
      // Check auth
      if (!Authorizations.canListTransactions(req.user)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_LIST,
          Constants.ENTITY_TRANSACTION,
          null,
          560,
          'TransactionService', 'handleGetChargingStationTransactions',
          req.user);
      }
      // Filter
      const filteredRequest = TransactionSecurity.filterChargingStationTransactionsRequest(req.query, req.user);
      // Charge Box is mandatory
      if (!filteredRequest.ChargeBoxID) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The Charging Station's ID must be provided`, 500,
          'TransactionService', 'handleGetChargingStationTransactions', req.user);
      }
      // Connector Id is mandatory
      if (!filteredRequest.ConnectorId) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `The Connector's ID must be provided`, 500,
          'TransactionService', 'handleGetChargingStationTransactions', req.user);
      }
      // Get Charge Box
      const chargingStation = await ChargingStation.getChargingStation(req.user.tenantID, filteredRequest.ChargeBoxID);
      // Found?
      if (!chargingStation) {
        // Not Found!
        throw new AppError(
          Constants.CENTRAL_SERVER,
          `Charging Station with ID '${filteredRequest.ChargeBoxID}' does not exist`, 550,
          'TransactionService', 'handleGetChargingStationTransactions', req.user);
      }
      // Set the model
      const transactions = await chargingStation.getTransactions(
        filteredRequest.ConnectorId,
        filteredRequest.StartDateTime,
        filteredRequest.EndDateTime,
        true);
      // Filter
      transactions.result = TransactionSecurity.filterTransactionsResponse(
        transactions.result, req.user);
      // Return
      res.json(transactions);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleGetTransactionYears(action, req, res, next) {
    try {
      // Get Transactions
      const transactionsYears = await TransactionStorage.getTransactionYears(req.user.tenantID);
      const result = {};
      if (transactionsYears) {
        result.years = [];
        result.years.push(new Date().getFullYear());
      }
      // Return
      res.json(transactionsYears);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleGetTransactionsActive(action, req, res, next) {
    try {
      // Check auth
      if (!Authorizations.canListTransactions(req.user)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_LIST,
          Constants.ENTITY_TRANSACTION,
          null,
          560,
          'TransactionService', 'handleGetTransactionsActive',
          req.user);
      }
      const filter = {stop: {$exists: false}};
      // Filter
      const filteredRequest = TransactionSecurity.filterTransactionsActiveRequest(req.query, req.user);
      if (filteredRequest.ChargeBoxID) {
        filter.chargeBoxID = filteredRequest.ChargeBoxID;
      }
      if (filteredRequest.ConnectorId) {
        filter.connectorId = filteredRequest.ConnectorId;
      }
      // Get Transactions
      const transactions = await TransactionStorage.getTransactions(req.user.tenantID,
        {...filter, 'withChargeBoxes': true},
        filteredRequest.Limit, filteredRequest.Skip, filteredRequest.Sort);
      // Filter
      transactions.result = TransactionSecurity.filterTransactionsResponse(
        transactions.result, req.user);
      // Return
      res.json(transactions);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleGetTransactionsCompleted(action, req, res, next) {
    try {
      // Check auth
      if (!Authorizations.canListTransactions(req.user)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_LIST,
          Constants.ENTITY_TRANSACTION,
          null,
          560,
          'TransactionService', 'handleGetTransactionsCompleted',
          req.user);
      }
      const filter = {stop: {$exists: true}};
      // Filter
      const filteredRequest = TransactionSecurity.filterTransactionsCompletedRequest(req.query, req.user);
      if (filteredRequest.ChargeBoxID) {
        filter.chargeBoxID = filteredRequest.ChargeBoxID;
      }
      // Date
      if (filteredRequest.StartDateTime) {
        filter.startDateTime = filteredRequest.StartDateTime;
      }
      if (filteredRequest.EndDateTime) {
        filter.endDateTime = filteredRequest.EndDateTime;
      }
      if (filteredRequest.UserID) {
        filter.userId = filteredRequest.UserID;
      // Basic?
      } else if (Authorizations.isBasic(req.user)) {
        filter.userId = req.user.id;
      }
      if (filteredRequest.Type) {
        filter.type = filteredRequest.Type;
      }
      if (filteredRequest.SiteAreaID) {
        filter.siteAreaID = filteredRequest.SiteAreaID;
      }
      const transactions = await TransactionStorage.getTransactions(req.user.tenantID,
        {...filter, 'search': filteredRequest.Search, 'siteID': filteredRequest.SiteID},
        filteredRequest.Limit, filteredRequest.Skip, filteredRequest.Sort);
      // Filter
      transactions.result = TransactionSecurity.filterTransactionsResponse(
        transactions.result, req.user);
      // Return
      res.json(transactions);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleGetTransactionsExport(action, req, res, next) {
    try {
      // Check auth
      if (!Authorizations.canListTransactions(req.user)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_LIST,
          Constants.ENTITY_TRANSACTIONS,
          null,
          560,
          'TransactionService', 'handleGetTransactionsExport',
          req.user);
      }
      const filter = {stop: {$exists: true}};
      // Filter
      const filteredRequest = TransactionSecurity.filterTransactionsCompletedRequest(req.query, req.user);
      if (filteredRequest.ChargeBoxID) {
        filter.chargeBoxID = filteredRequest.ChargeBoxID;
      }
      // Date
      if (filteredRequest.StartDateTime) {
        filter.startDateTime = filteredRequest.StartDateTime;
      }
      if (filteredRequest.EndDateTime) {
        filter.endDateTime = filteredRequest.EndDateTime;
      }
      if (filteredRequest.UserID) {
        filter.userId = filteredRequest.UserID;
      }
      if (filteredRequest.Type) {
        filter.type = filteredRequest.Type;
      }
      if (filteredRequest.SiteAreaID) {
        filter.siteAreaID = filteredRequest.SiteAreaID;
      }
      const transactions = await TransactionStorage.getTransactions(req.user.tenantID,
        {...filter, 'search': filteredRequest.Search, 'siteID': filteredRequest.SiteID},
        filteredRequest.Limit, filteredRequest.Skip, filteredRequest.Sort);
      // Filter
      transactions.result = TransactionSecurity.filterTransactionsResponse(
        transactions.result, req.user);

      const filename = "transactions_export.csv";
      fs.writeFile(filename, this.convertToCSV(transactions.result), (err) => {
        if (err) {
          throw err;
        }
        res.download(filename, (err) => {
          if (err) {
            throw err;
          }
          fs.unlink(filename, (err) => {
            if (err) {
              throw err;
            }
          });
        });
      });
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static async handleGetTransactionsInError(action, req, res, next) {
    try {
      // Check auth
      if (!Authorizations.canListTransactionsInError(req.user)) {
        // Not Authorized!
        throw new AppAuthError(
          Constants.ACTION_LIST,
          Constants.ENTITY_TRANSACTION,
          null,
          560,
          'TransactionService', 'handleGetTransactionsInError',
          req.user);
      }
      const filter = {stop: {$exists: true}};
      // Filter
      const filteredRequest = TransactionSecurity.filterTransactionsInErrorRequest(req.query, req.user);
      if (filteredRequest.ChargeBoxID) {
        filter.chargeBoxID = filteredRequest.ChargeBoxID;
      }
      // Date
      if (filteredRequest.StartDateTime) {
        filter.startDateTime = filteredRequest.StartDateTime;
      }
      if (filteredRequest.EndDateTime) {
        filter.endDateTime = filteredRequest.EndDateTime;
      }
      if (filteredRequest.UserID) {
        filter.userId = filteredRequest.UserID;
      }
      const transactions = await TransactionStorage.getTransactionsInError(req.user.tenantID,
        {...filter, 'search': filteredRequest.Search, 'siteID': filteredRequest.SiteID},
        filteredRequest.Limit, filteredRequest.Skip, filteredRequest.Sort);
      // Filter
      transactions.result = TransactionSecurity.filterTransactionsResponse(
        transactions.result, req.user);
      // Return
      res.json(transactions);
      next();
    } catch (error) {
      // Log
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next);
    }
  }

  static convertToCSV(transactions) {
    let csv = 'id,chargeBoxID,connectorID,userID,tagID,startDate,endDate,meterStart,meterStop,totalConsumption,totalDuration,totalInactivity,price,priceUnit\r\n';
    for (const transaction of transactions) {
      csv += `${transaction.id},`;
      csv += `${transaction.chargeBoxID},`;
      csv += `${transaction.connectorId},`;
      csv += `${transaction.user ? transaction.user.id : ''},`;
      csv += `${transaction.tagID},`;
      csv += `${transaction.timestamp},`;
      csv += `${transaction.stop ? transaction.stop.timestamp : ''},`;
      csv += `${transaction.meterStart},`;
      csv += `${transaction.stop ? transaction.stop.meterStop : ''},`;
      csv += `${transaction.stop ? transaction.stop.totalConsumption : ''},`;
      csv += `${transaction.stop ? transaction.stop.totalDurationSecs : ''},`;
      csv += `${transaction.stop ? transaction.stop.totalInactivitySecs : ''},`;
      csv += `${transaction.stop ? transaction.stop.price : ''},`;
      csv += `${transaction.stop ? transaction.stop.priceUnit : ''}\r\n`;
    }
    return csv;
  }
}

module.exports = TransactionService;
