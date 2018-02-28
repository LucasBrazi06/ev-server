const Utils = require('../utils/Utils');
const SoapChargingStationClient = require('../client/soap/SoapChargingStationClient');
const Logging = require('../utils/Logging');
const User = require('./User');
const SiteArea = require('./SiteArea');
const Users = require('../utils/Users');
const AppError = require('../exception/AppError');
const Constants = require('../utils/Constants');
const Database = require('../utils/Database');
const moment = require('moment');
const Configuration = require('../utils/Configuration');
const NotificationHandler = require('../notification/NotificationHandler');

_configAdvanced = Configuration.getAdvancedConfig();
_configChargingStation = Configuration.getChargingStationConfig();

class ChargingStation {
	constructor(chargingStation) {
		// Init model
		this._model = {};
		// Set it
		Database.updateChargingStation(chargingStation, this._model);
	}

	handleAction(action, params) {
		// Handle Client Requests
		switch (action) {
			// Reset
			case "Reset":
				return this.requestReset(params.type);

			// Clear cache
			case "ClearCache":
				return this.requestClearCache();

			// Get Configuration
			case "GetConfiguration":
				return this.requestGetConfiguration(params.keys);

			// Set Configuration
			case "ChangeConfiguration":
				// Change the config
				return this.requestChangeConfiguration(params.key, params.value);
			// Unlock Connector
			case "UnlockConnector":
				return this.requestUnlockConnector(params.connectorId);

			// Stop Transaction
			case "StopTransaction":
				return this.requestStopTransaction(params.transactionId);

			// Not Exists!
			default:
				// Log
				Logging.logError({
					module: "ChargingStation", method: "handleAction",
					message: `Action does not exist: ${action}` });
				throw new Error(`Action does not exist: ${action}`);
		}
	}

	getID() {
		return this._model.id;
	}

	setSiteArea(siteArea) {
		if (siteArea) {
			this._model.siteArea = siteArea.getModel();
			this._model.siteAreaID = siteArea.getID();
		} else {
			this._model.siteArea = null;
		}
	}

	getSiteArea() {
		if (this._model.siteArea) {
			return Promise.resolve(new SiteArea(this._model.siteArea));
		} else if (this._model.siteAreaID){
			// Get from DB
			return global.storage.getSiteArea(this._model.siteAreaID).then((siteArea) => {
				// Keep it
				this.setSiteArea(siteArea);
				return siteArea;
			});
		} else {
			return Promise.resolve(null);
		}
	}

	getChargePointVendor() {
		return this._model.chargePointVendor;
	}

	setChargePointVendor(chargePointVendor) {
		this._model.chargePointVendor = chargePointVendor;
	}

	getChargePointModel() {
		return this._model.chargePointModel;
	}

	setChargePointModel(chargePointModel) {
		this._model.chargePointModel = chargePointModel;
	}

	getChargePointSerialNumber() {
		return this._model.chargePointSerialNumber;
	}

	setChargePointSerialNumber(chargePointSerialNumber) {
		this._model.chargePointSerialNumber = chargePointSerialNumber;
	}

	getChargeBoxSerialNumber() {
		return this._model.chargeBoxSerialNumber;
	}

	setChargeBoxSerialNumber(chargeBoxSerialNumber) {
		this._model.chargeBoxSerialNumber = chargeBoxSerialNumber;
	}

	getFirmwareVersion() {
		return this._model.firmwareVersion;
	}

	setFirmwareVersion(firmwareVersion) {
		this._model.firmwareVersion = firmwareVersion;
	}

	getIccid() {
		return this._model.iccid;
	}

	setIccid(iccid) {
		this._model.iccid = iccid;
	}

	getImsi() {
		return this._model.imsi;
	}

	setImsi(imsi) {
		this._model.imsi = imsi;
	}

	getMeterType() {
		return this._model.meterType;
	}

	setMeterType(meterType) {
		this._model.meterType = meterType;
	}

	getMeterSerialNumber() {
		return this._model.meterSerialNumber;
	}

	setMeterSerialNumber(meterSerialNumber) {
		this._model.meterSerialNumber = meterSerialNumber;
	}

	getCreatedBy() {
		if (this._model.createdBy) {
			return new User(this._model.createdBy);
		}
		return null;
	}

	setCreatedBy(user) {
		this._model.createdBy = user.getModel();
	}

	getCreatedOn() {
		return this._model.createdOn;
	}

	setCreatedOn(createdOn) {
		this._model.createdOn = createdOn;
	}

	getLastChangedBy() {
		if (this._model.lastChangedBy) {
			return new User(this._model.lastChangedBy);
		}
		return null;
	}

	setLastChangedBy(user) {
		this._model.lastChangedBy = user.getModel();
	}

	getLastChangedOn() {
		return this._model.lastChangedOn;
	}

	setLastChangedOn(lastChangedOn) {
		this._model.lastChangedOn = lastChangedOn;
	}

	getEndPoint() {
		return this._model.endpoint;
	}

	setEndPoint(endpoint) {
		this._model.endpoint = endpoint;
	}

	getOcppVersion() {
		return this._model.ocppVersion;
	}

	setOcppVersion(ocppVersion) {
		this._model.ocppVersion = ocppVersion;
	}

	getChargingStationClient() {
		// Already created?
		if (!this._chargingStationClient) {
			// Init client
			return new SoapChargingStationClient(this).then((soapClient) => {
				this._chargingStationClient = soapClient;
				return this._chargingStationClient;
			});
		} else {
			return Promise.resolve(this._chargingStationClient);
		}
	}

	getLastHeartBeat() {
		return this._model.lastHeartBeat;
	}

	setLastHeartBeat(lastHeartBeat) {
		this._model.lastHeartBeat = lastHeartBeat;
	}

	getConnectors() {
		return this._model.connectors;
	}

	setConnectors(connectors) {
		this._model.connectors = connectors;
	}

	getLastReboot() {
		return this._model.lastReboot;
	}

	setLastReboot(lastReboot) {
		this._model.lastReboot = lastReboot;
	}

	getModel() {
		return this._model;
	}

	save() {
		// Init Connectors
		if (!this.getConnectors()) {
			this.setConnectors([]);
		}

		// Save
		return global.storage.saveChargingStation(this.getModel());
	}

	saveHeartBeat() {
		// Save
		return global.storage.saveChargingStationHeartBeat(this.getModel());
	}

	saveChargingStationSiteArea() {
		// Save
		return global.storage.saveChargingStationSiteArea(this.getModel());
	}

	handleStatusNotification(statusNotification) {
		// Set the Station ID
		statusNotification.chargeBoxID = this.getID();

		// Update the connector -----------------------------------------
		// Get the connectors
		let connectors = this.getConnectors();

		// Init previous connector status
		for (var i = 0; i < statusNotification.connectorId; i++) {
			// Check if former connector can be set
			if (!connectors[i]) {
				// Init
				connectors[i] = { connectorId: i+1, currentConsumption: 0, status: 'Unknown', power: 0 };
			}
		}

		// Set the status
		connectors[statusNotification.connectorId-1].connectorId = statusNotification.connectorId;
		// Error Code?
		connectors[statusNotification.connectorId-1].status = statusNotification.status;
		connectors[statusNotification.connectorId-1].errorCode = statusNotification.errorCode;
		this.setConnectors(connectors);

		// Compute the power of the connector
		// Use a function to pass the connector`
		return ((connector) => {
			// Get the configuration
			return this.getConfiguration().then((configuration) => {
				var voltageRerefence = 0;
				var current = 0;
				var chargerConsumption = 0;
				var nbPhase = 0;

				if (configuration && configuration.configuration) {
					// Search for params
					for (var i = 0; i < configuration.configuration.length; i++) {
						// Check
						switch (configuration.configuration[i].key) {
							// Voltage
							case "voltagererefence":
								// Get the meter interval
								voltageRerefence = parseInt(configuration.configuration[i].value);
								break;

							// Current
							case "currentpb1":
								// Get the meter interval
								current = parseInt(configuration.configuration[i].value);
								break;

							// Nb Phase
							case "nbphase":
								// Get the meter interval
								nbPhase = parseInt(configuration.configuration[i].value);
								break;
						}
					}

					// Compute it
					if (voltageRerefence && current && nbPhase) {
						// One Phase?
						if (nbPhase == 1) {
							connector.power = Math.floor(230 * current);
						} else {
							connector.power = Math.floor(400 * current * Math.sqrt(nbPhase));
						}
					}
					// Save Status Notif
					return global.storage.saveStatusNotification(statusNotification);
				} else {
					// Log
					return Promise.reject(new Error(`Cannot retrieve the Configuration of ${this.getID()}`));
				}
			}).then(() => {
				// Save Status
				return global.storage.saveChargingStationConnector(
					this.getModel(), statusNotification.connectorId);
			});
		})(connectors[statusNotification.connectorId-1]);
	}

	handleBootNotification(bootNotification) {
		// Set the Station ID
		bootNotification.chargeBoxID = this.getID();

		// Save Boot Notification
		return global.storage.saveBootNotification(bootNotification);
	}

	updateChargingStationConsumption(transactionId) {
		// Get the last tranasction first
		return this.getTransaction(transactionId).then((transaction) => {
			// Found?
			if (transaction) {
				// Get connectorId
				let connector = this.getConnectors()[transaction.connectorId-1];
				// Found?
				if (!transaction.stop) {
					// Get the consumption
					return this.getConsumptionsFromTransaction(transaction, false).then(
							(consumption) => {
						let currentConsumption = 0;
						let totalConsumption = 0;
						// Check
						if (consumption) {
							currentConsumption = (consumption.values.length > 0?consumption.values[consumption.values.length-1].value:0);
							totalConsumption = consumption.totalConsumption;
						}
						// Changed?
						if (connector.currentConsumption !== currentConsumption ||
								connector.totalConsumption !== totalConsumption) {
							// Set consumption
							connector.currentConsumption = currentConsumption;
							connector.totalConsumption = totalConsumption;
							// Log
							Logging.logInfo({
								module: "ChargingStation",
								method: "updateChargingStationConsumption", action: "ChargingStationConsumption",
								message: `${this.getID()} - ${connector.connectorId} - Consumption changed to ${connector.currentConsumption}, Total: ${connector.totalConsumption}` });
						}
						this.setLastHeartBeat(new Date());
						// Handle End Of charge
						this.handleNotificationEndOfCharge(transaction, consumption);
						// Save
						return this.save();
					});
				} else {
					// Check
					if (connector.currentConsumption !== 0 || connector.totalConsumption !== 0) {
						// Set consumption
						connector.currentConsumption = 0;
						connector.totalConsumption = 0;
						// Log
						Logging.logInfo({
							module: "ChargingStation",
							method: "updateChargingStationConsumption", action: "ChargingStationConsumption",
							message: `${this.getID()} - ${connector.connectorId} - Consumption changed to ${connector.currentConsumption}, Total: ${connector.totalConsumption}` });
						// Save
						return this.save();
					}
				}
			} else {
				// Log
				Logging.logError({
					module: "ChargingStation",
					method: "updateChargingStationConsumption", action: "ChargingStationConsumption",
					message: `${this.getID()} - Transaction ID '${transactionId}' not found` });
			}
		});
	}

	handleNotificationEndOfCharge(transaction, consumption) {
		// Transaction in progress?
		if (transaction && !transaction.stop) {
			// Has consumption?
			if (consumption && consumption.values && consumption.values.length > 1) {
				// Compute avg of last two values
				let avgConsumption = (consumption.values[consumption.values.length-1].value +
					consumption.values[consumption.values.length-2].value) / 2;
				// --------------------------------------------------------------------
				// Notification END of charge
				// --------------------------------------------------------------------
				if (_configChargingStation.notifEndOfChargeEnabled && avgConsumption === 0) {
					// Send Notification
					if (transaction.user) {
						NotificationHandler.sendEndOfCharge(
							transaction.transactionId + "-EOF",
							transaction.user,
							this.getModel(),
							{
								"user": transaction.user,
								"chargingBoxID": this.getID(),
								"connectorId": transaction.connectorId,
								"totalConsumption": (this.getConnectors()[transaction.connectorId-1].totalConsumption/1000).toLocaleString(
									(transaction.user.locale ? transaction.user.locale.replace('_','-') : Users.DEFAULT_LOCALE.replace('_','-')),
									{minimumIntegerDigits:1, minimumFractionDigits:0, maximumFractionDigits:2}),
								"evseDashboardChargingStationURL" : Utils.buildEvseTransactionURL(this, transaction.connectorId, transaction.transactionId),
								"notifStopTransactionAndUnlockConnector": _configChargingStation.notifStopTransactionAndUnlockConnector
							},
							transaction.user.locale);
					}

					// Stop Transaction and Unlock Connector?
					if (_configChargingStation.notifStopTransactionAndUnlockConnector) {
						// Yes: Stop the transaction
						this.requestStopTransaction(transaction.transactionId).then((result) => {
							// Ok?
							if (result && result.status === "Accepted") {
								// Unlock the connector
								this.requestUnlockConnector(transaction.connectorId).then((result) => {
									// Ok?
									if (result && result.status === "Accepted") {
										// Nothing to do
										return Promise.resolve();
									} else {
										// Cannot unlock the connector
										Logging.logError({
											module: "ChargingStation", method: "handleNotificationEndOfCharge",
											action: "NotifyEndOfCharge", message: `Cannot unlock the connector '${transaction.connectorId}' of the Charging Station '${this.getID()}'`,
											detailedMessages: transaction});
										}
									});
							} else {
								// Cannot stop the transaction
								Logging.logError({
									module: "ChargingStation", method: "handleNotificationEndOfCharge",
									action: "NotifyEndOfCharge", message: `Cannot stop the transaction of the Charging Station '${this.getID()}'`,
									detailedMessages: transaction});
							}
						});
					}
				}
			}
		}
	}

	handleMeterValues(meterValues) {
		// Create model
		var newMeterValues = {};
		// Init
		newMeterValues.values = [];
		// Set the charger ID
		newMeterValues.chargeBoxID = this.getID();
		// Check if OCPP 1.6
		if (meterValues.meterValue) {
			// Set it to 'values'
			meterValues.values = meterValues.meterValue;
		}
		// Only one value?
		if (!Array.isArray(meterValues.values)) {
			// Make it an array
			meterValues.values = [meterValues.values];
		}
		// For each value
		meterValues.values.forEach((value, index) => {
			var newMeterValue = {};
			// Set the ID
			newMeterValue.chargeBoxID = newMeterValues.chargeBoxID;
			newMeterValue.connectorId = meterValues.connectorId;
			if (meterValues.transactionId) {
				newMeterValue.transactionId = meterValues.transactionId;
			}
			newMeterValue.timestamp = value.timestamp;

			// Check OCPP 1.6
			if (value.sampledValue) {
				// Normalize
				value.value = value.sampledValue;
			}

			// Values provided?
			if (value.value) {
				// OCCP1.2: Set the values
				if(value.value.$value) {
					// Set
					newMeterValue.value = value.value.$value;
					newMeterValue.attribute = value.value.attributes;
				} else {
					newMeterValue.value = parseInt(value.value);
				}
			}
			// Add
			newMeterValues.values.push(newMeterValue);
		});

		// Save Meter Values
		return global.storage.saveMeterValues(newMeterValues).then((result) => {
			// Update Charging Station Consumption
			return this.updateChargingStationConsumption(meterValues.transactionId);
		})
	}

	saveConfiguration(configuration) {
		// Set the charger ID
		configuration.chargeBoxID = this.getID();
		configuration.timestamp = new Date();

		// Save config
		return global.storage.saveConfiguration(configuration);
	}

	setDeleted(deleted) {
		this._model.deleted = deleted;
	}

	isDeleted() {
		return this._model.deleted;
	}

	deleteTransaction(transaction) {
		// Yes: save it
		return global.storage.deleteTransaction(transaction);
	}

	delete() {
		// Check if the user has a transaction
		return this.hasAtLeastOneTransaction().then((result) => {
			if (result) {
				// Delete logically
				// Set deleted
				this.setDeleted(true);
				// Delete
				return this.save();
			} else {
				// Delete physically
				return global.storage.deleteChargingStation(this.getID());
			}
		})
	}

	handleStartTransaction(transaction) {
		// Set the charger ID
		transaction.chargeBoxID = this.getID();
		// Check if already exists
		if (!transaction.id) {
			// No: Check user and save
			return this.checkIfUserIsAuthorized(transaction, global.storage.saveStartTransaction);
		} else {
			// Yes: save it
			return global.storage.saveStartTransaction(transaction);
		}
	}

	handleDataTransfer(dataTransfer) {
		// Set the charger ID
		dataTransfer.chargeBoxID = this.getID();
		dataTransfer.timestamp = new Date();

		// Save it
		return global.storage.saveDataTransfer(dataTransfer);
	}

	handleDiagnosticsStatusNotification(diagnosticsStatusNotification) {
		// Set the charger ID
		diagnosticsStatusNotification.chargeBoxID = this.getID();
		diagnosticsStatusNotification.timestamp = new Date();

		// Save it
		return global.storage.saveDiagnosticsStatusNotification(diagnosticsStatusNotification);
	}

	handleFirmwareStatusNotification(firmwareStatusNotification) {
		// Set the charger ID
		firmwareStatusNotification.chargeBoxID = this.getID();
		firmwareStatusNotification.timestamp = new Date();

		// Save it
		return global.storage.saveFirmwareStatusNotification(firmwareStatusNotification);
	}

	handleAuthorize(authorize) {
		// Set the charger ID
		authorize.chargeBoxID = this.getID();
		authorize.timestamp = new Date();

		// Execute
		return this.checkIfUserIsAuthorized(authorize, global.storage.saveAuthorize);
	}

	checkIfUserIsAuthorized(request, saveFunction) {
		// Check first if the site area access control is active
		return this.getSiteArea().then((siteArea) => {
			if (siteArea && !siteArea.isAccessControlEnabled()) {
				// Access Control disabled
				// Execute the function
				return saveFunction(request);
			}
			// Check User
			return global.storage.getUserByTagId(request.idTag).then((user) => {
				// Found?
				if (user) {
					// Check status
					if (user.getStatus() !== Users.USER_STATUS_ACTIVE) {
						// Reject but save ok
						return Promise.reject( new AppError(
							`User with TagID ${request.idTag} is not Active`, 500,
							"ChargingStation", "checkIfUserIsAuthorized",
							null, user) );
					} else {
						// Save it
						request.user = user;
						// Execute the function
						return saveFunction(request).then(() => {
							// Check function
							if (saveFunction.name === "saveStartTransaction") {
								if (user) {
									// Notify
									NotificationHandler.sendTransactionStarted(
										request.transactionId,
										user.getModel(),
										this.getModel(),
										{
											"user": user.getModel(),
											"chargingBoxID": this.getID(),
											"connectorId": request.connectorId,
											"evseDashboardChargingStationURL" : Utils.buildEvseTransactionURL(this, request.connectorId, request.transactionId)
										},
										user.getLocale()
									);
								}
							}
						});
					}
				} else {
					// Create an empty user
					var newUser = new User({
						name: "Unknown",
						firstName: "User",
						status: Users.USER_STATUS_PENDING,
						role: Users.USER_ROLE_BASIC,
						email: request.idTag + "@sap.com",
						tagIDs: [request.idTag],
						createdBy: Constants.CENTRAL_SERVER,
						createdOn: new Date().toISOString()
					});

					// Save the user
					return newUser.save().then((user) => {
						// Send Notification
						NotificationHandler.sendUnknownUserBadged(
							Utils.generateGUID(),
							this.getModel(),
							{
								"chargingBoxID": this.getID(),
								"badgeId": request.idTag,
								"evseDashboardUserURL" : Utils.buildEvseUserURL(user)
							}
						);
						// Reject but save ok
						return Promise.reject( new Error(`User with Tag ID ${request.idTag} not found but saved as inactive user`) );
					}, (err) => {
						// Reject, cannot save
						return Promise.reject( new Error(`User with Tag ID ${request.idTag} not found and cannot be created: ${err.message}`) );
					});
				}
			});
		});
	}

	getTransaction(transactionId) {
		// Get the tranasction first (to get the connector id)
		return global.storage.getTransaction(transactionId);
	}

	handleStopTransaction(stopTransaction) {
		// Set the charger ID
		stopTransaction.chargeBoxID = this.getID();
		// Get the transaction first (to get the connector id)
		return this.getTransaction(stopTransaction.transactionId).then((transaction) => {
			if (transaction) {
				// Init the charging station
				this.getConnectors()[transaction.connectorId-1].currentConsumption = 0;
				this.getConnectors()[transaction.connectorId-1].totalConsumption = 0;
				// Save it
				this.save();
				// Compute total consumption (optimization)
				return this.getConsumptionsFromTransaction(transaction, true);
			} else {
				throw new Error(`The Transaction ID '${stopTransaction.transactionId}' does not exist`);
			}
		}).then((consumption) => {
			// Set the total consumption (optimization)
			stopTransaction.totalConsumption = consumption.totalConsumption;
			// User Provided?
			if (stopTransaction.idTag) {
				// Save it with the user
				return this.checkIfUserIsAuthorized(stopTransaction, global.storage.saveStopTransaction);
			} else {
				// Save it without the User
				return global.storage.saveStopTransaction(stopTransaction);
			}
		});
	}

	// Restart the charger
	requestReset(type) {
		// Get the client
		return this.getChargingStationClient().then((chargingStationClient) => {
			// Restart
			return chargingStationClient.reset(type);
		});
	}

	// Stop Transaction
	requestStopTransaction(params) {
		// Get the client
		return this.getChargingStationClient().then((chargingStationClient) => {
			// Restart
			return chargingStationClient.stopTransaction(params);
		});
	}

	// Clear the cache
	requestClearCache() {
		// Get the client
		return this.getChargingStationClient().then((chargingStationClient) => {
			// Restart
			return chargingStationClient.clearCache();
		});
	}

	// Get the configuration for the EVSE
	requestGetConfiguration(configParamNames) {
		// Get the client
		return this.getChargingStationClient().then((chargingStationClient) => {
			// Get config
			return chargingStationClient.getConfiguration(configParamNames);
		});
	}

	// Get the configuration for the EVSE
	requestChangeConfiguration(key, value) {
		// Get the client
		return this.getChargingStationClient().then((chargingStationClient) => {
			// Get config
			return chargingStationClient.changeConfiguration(key, value);
		// Result
		}).then((result) => {
			// Request the new Configuration?
			if (result.status === "Accepted") {
				// Get the Charging Station Config
				return this.requestGetConfiguration();
			} else {
				// Log
				return Promise.reject(new Error(`Cannot set the configuration param ${key} with value ${value} to ${this.getID()}`));
			}
		}).then((configuration) => {
			// Save it
			if (configuration) {
				// Save
				return this.saveConfiguration(configuration).then((config) => {
					// Ok ?
					if (config) {
						// Return the first result
						return {"status": "Accepted"};
					}
				});
			} else {
				// Log
				return Promise.reject(new Error(`Cannot retrieve the Configuration of ${this.getID()}`));
			}
		});
	}

	// Unlock connector
	requestUnlockConnector(params) {
		// Get the client
		return this.getChargingStationClient().then((chargingStationClient) => {
			// Get config
			return chargingStationClient.unlockConnector(params);
		});
	}

	getStatusNotifications(connectorId) {
		return global.storage.getStatusNotifications(this.getID(), connectorId).then((statusNotifications) => {
			return statusNotifications;
		});
	}

	getLastStatusNotification(connectorId) {
		return global.storage.getLastStatusNotification(this.getID(), connectorId).then((statusNotification) => {
			return statusNotification;
		});
	}

	getConfiguration() {
		return global.storage.getConfiguration(this.getID()).then((configuration) => {
			return configuration;
		});
	}

	getConfigurationParamValue(paramName) {
		return global.storage.getConfigurationParamValue(this.getID(), paramName).then((paramValue) => {
			return paramValue;
		});
	}

	hasAtLeastOneTransaction() {
		// Get the consumption
		return global.storage.getTransactions(
				null,
				{"chargeBoxID": this.getID()},
				null,
				false,
				1).then((transactions) => {
			return (transactions && transactions.length > 0 ? true : false);
		});;
	}

	getTransactions(connectorId, startDateTime, endDateTime, withImage) {
		// Get the consumption
		return global.storage.getTransactions(
			null,
			{"chargeBoxID": this.getID(),
			 "connectorId": connectorId,
			 "startDateTime": startDateTime,
			 "endDateTime" : endDateTime},
			null,
			withImage,
		 	Constants.NO_LIMIT);
	}

	getConsumptionsFromTransaction(transaction, optimizeNbrOfValues) {
		// Get the last 5 meter values
		return global.storage.getMeterValuesFromTransaction(
				transaction.id).then((meterValues) => {
			// Read the pricing
			return global.storage.getPricing().then((pricing) => {
				// Build the header
				var chargingStationConsumption = {};
				if (pricing) {
					chargingStationConsumption.priceUnit = pricing.priceUnit;
					chargingStationConsumption.totalPrice = 0;
				}
				chargingStationConsumption.values = [];
				chargingStationConsumption.totalConsumption = 0;
				chargingStationConsumption.chargeBoxID = this.getID();
				chargingStationConsumption.connectorId = transaction.connectorId;
				chargingStationConsumption.transactionId = transaction.id;
				chargingStationConsumption.user = transaction.user;
				if (transaction.stop && transaction.stop.user) {
					chargingStationConsumption.stop = {};
					chargingStationConsumption.stop.user = transaction.stop.user;
				}
				// Compute consumption
				let consumptions = this.buildConsumption(chargingStationConsumption, meterValues, transaction, pricing, optimizeNbrOfValues);

				return consumptions;
			});
		});
	}

	getConsumptionsFromDateTimeRange(transaction, startDateTime) {
		// Get all from the transaction (not optimized)
		return this.getConsumptionsFromTransaction(transaction, false).then((consumptions) => {
			// Found?
			if (consumptions && consumptions.values) {
				// Start date
				let startDateMoment = moment(startDateTime);
				// Filter value per date
				consumptions.values = consumptions.values.filter((consumption) => {
					// Filter
					return moment(consumption.date).isAfter(startDateMoment);
				});
			}
			return consumptions;
		});
	}

	// Method to build the consumption
	buildConsumption(chargingStationConsumption, meterValues, transaction, pricing, optimizeNbrOfValues) {
		// Init
		let totalNbrOfMetrics = 0;
		let lastMeterValue;
		let firstMeterValueSet = false;
		// Set first value from transaction
		if (meterValues && meterValues.length > 0 && transaction) {
			// Set last meter value
			let meterValueFromTransactionStart = {
				id: '666',
				connectorId: transaction.connectorId,
				transactionId: transaction.transactionId,
				timestamp: transaction.timestamp,
				value: transaction.meterStart,
				attribute: {
					unit: 'Wh',
					location: 'Outlet',
					measurand: 'Energy.Active.Import.Register',
					format: 'Raw',
					context: 'Sample.Periodic'
				}
			};
			// Append
			meterValues.splice(0, 0, meterValueFromTransactionStart);

			// Set last value from transaction
			if (transaction.stop) {
				// Set last meter value
				let meterValueFromTransactionStop = {
					id: '6969',
					connectorId: transaction.connectorId,
					transactionId: transaction.transactionId,
					timestamp: transaction.stop.timestamp,
					value: transaction.stop.meterStop,
					attribute: {
						unit: 'Wh',
						location: 'Outlet',
						measurand: 'Energy.Active.Import.Register',
						format: 'Raw',
						context: 'Sample.Periodic'
					}
				};
				// Append
				meterValues.push(meterValueFromTransactionStop);
			}
		}
		// Build the model
		meterValues.forEach((meterValue, meterValueIndex) => {
			// Get the stored values
			let numberOfReturnedMeters = chargingStationConsumption.values.length;

			// Filter on consumption value
			if (meterValue.attribute && meterValue.attribute.measurand &&
					meterValue.attribute.measurand === "Energy.Active.Import.Register") {
				// Get the moment
				let currentTimestamp = moment(meterValue.timestamp);
				// First value?
				if (!firstMeterValueSet) {
					// No: Keep the first value
					lastMeterValue = meterValue;
					// Ok
					firstMeterValueSet = true;
				// Calculate the consumption with the last value provided
				} else {
					// Value provided?
					if (meterValue.value > 0 || lastMeterValue.value > 0) {
						// Last value is > ?
						if (lastMeterValue.value > meterValue.value) {
							// Yes: reinit it (the value has started over from 0)
							lastMeterValue.value = 0;
						}
						// Get the moment
						let currentTimestamp = moment(meterValue.timestamp);
						// Check if it will be added
						let addValue = false;
						// Start to return the value after the requested date
						if (!chargingStationConsumption.startDateTime ||
								currentTimestamp.isAfter(chargingStationConsumption.startDateTime) ) {
							// Set default
							addValue = true;
							// Count
							totalNbrOfMetrics++;
							// Get the diff
							var diffSecs = currentTimestamp.diff(lastMeterValue.timestamp, "seconds");
							// Sample multiplier
							let sampleMultiplier = 3600 / diffSecs;
							// compute
							let currentConsumption = (meterValue.value - lastMeterValue.value) * sampleMultiplier;
							// At least one value returned
							if (numberOfReturnedMeters > 0) {
								// Consumption?
								if (currentConsumption > 0) {
									// 0..123 -> Current value is positive and n-1 is 0: add 0 before the end graph is drawn
									if (chargingStationConsumption.values[numberOfReturnedMeters-1].value === 0) {
										// Check the timeframe: should be just before: if not add one
										if (currentTimestamp.diff(chargingStationConsumption.values[numberOfReturnedMeters-1].date, "seconds") > diffSecs) {
											// Add a 0 just before
											chargingStationConsumption.values.push({date: currentTimestamp.clone().subtract(diffSecs, "seconds").toDate(), value: 0 });
										}
									// Return one value every 'n' time intervals
									} else if (optimizeNbrOfValues && currentTimestamp.diff(chargingStationConsumption.values[numberOfReturnedMeters-1].date, "seconds") < _configAdvanced.chargeCurveTimeFrameSecsPoint) {
										// Do not add
										addValue = false;
									}
								} else {
									// Check if last but one consumption was 0 and not the last meter value
									if (optimizeNbrOfValues && (chargingStationConsumption.values[numberOfReturnedMeters-1].value === 0) &&
											(meterValueIndex !== meterValues.length-1)) {
										// Do not add
										addValue = false;
									}
								}
							}
							// Counting
							let consumptionWh = meterValue.value - lastMeterValue.value;
							chargingStationConsumption.totalConsumption += consumptionWh;
							// Compute the price
							if (pricing) {
								chargingStationConsumption.totalPrice += (consumptionWh/1000) * pricing.priceKWH;
							}
							// Add it?
							if (addValue) {
								// Create
								let consumption = {
									date: meterValue.timestamp,
									value: currentConsumption,
									cumulated: chargingStationConsumption.totalConsumption };
								// Compute the price
								if (pricing) {
									// Set the consumption with price
									consumption.price = (consumptionWh/1000) * pricing.priceKWH;
								}
								// Set the consumption
								chargingStationConsumption.values.push(consumption);
							}
							// Debug
							//console.log(`Date: ${meterValue.timestamp.toISOString()}, Last Meter: ${lastMeterValue.value}, Meter: ${meterValue.value}, Conso: ${currentConsumption}, Cumulated: ${chargingStationConsumption.totalConsumption}`);
						}
					} else {
						// Last one is 0, set it to 0
						if (!optimizeNbrOfValues || meterValueIndex === meterValues.length-1) {
							// Add a 0 just before
							chargingStationConsumption.values.push({date: currentTimestamp.toDate(), value: 0 });
						}
					}
					// Set Last Value
					lastMeterValue = meterValue;
				}
			}
		});
		if (totalNbrOfMetrics) {
			// Log
			Logging.logDebug({
				source: this.getID(), module: "ChargingStation",
				method: "buildConsumption", action:"BuildConsumption",
				message: `Consumption - ${meterValues.length} metrics, ${totalNbrOfMetrics} relevant, ${chargingStationConsumption.values.length} returned` });
		}
		// Return the result
		return chargingStationConsumption;
	}
}

module.exports = ChargingStation;
