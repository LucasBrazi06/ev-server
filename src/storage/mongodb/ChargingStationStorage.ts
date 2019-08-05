import BackendError from '../../exception/BackendError';
import ChargingStation from '../../types/ChargingStation';
import Constants from '../../utils/Constants';
import DatabaseUtils from './DatabaseUtils';
import DbParams from '../../types/database/DbParams';
import global from '../../types/GlobalType';
import Logging from '../../utils/Logging';
import Utils from '../../utils/Utils';
import Connector from '../../types/Connector';
import TenantStorage from './TenantStorage';
import UtilsService from '../../server/rest/service/UtilsService';

export default class ChargingStationStorage {

  public static async getChargingStation(tenantID: string, id: string): Promise<ChargingStation> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'getChargingStation');
    // Query single Charging Station
    const chargingStationsMDB = await ChargingStationStorage.getChargingStations(tenantID, {
      chargingStationID: id,
      withSite: true
    }, Constants.DB_PARAMS_SINGLE_RECORD);
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'getChargingStation', uniqueTimerID, { id });
    return chargingStationsMDB.result[0];
  }

  public static async getChargingStations(tenantID: string,
    params: { search?: string; chargingStationID?: string; siteAreaID?: string; withNoSiteArea?: boolean; siteIDs?: string[]; withSite?: boolean;
      errorType?: ('missingSettings'|'connectionBroken'|'connectorError'|'missingSiteArea'|'all')[]; includeDeleted?: boolean; },
    dbParams: DbParams, projectFields?: string[]): Promise<{count: number; result: ChargingStation[]}> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'getChargingStations');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    // Check Limit
    dbParams.limit = Utils.checkRecordLimit(dbParams.limit);
    // Check Skip
    dbParams.skip = Utils.checkRecordSkip(dbParams.skip);
    // Create Aggregation
    let aggregation = [];
    const siteAreaJoin = [];
    const siteJoin = [];
    // Set the filters
    const filters: any = {
      $and: [{
        $or: DatabaseUtils.getNotDeletedFilter()
      }]
    };
    // Include deleted charging stations if requested
    if (params.includeDeleted) {
      filters.$and[0].$or.push({
        'deleted': true
      });
    }
    if (params.chargingStationID) {
      filters.$and.push({
        _id: params.chargingStationID
      });
    // Search filters
    } else if (params.search) {
      // Build filter
      filters.$and.push({
        '$or': [
          { '_id': { $regex: params.search, $options: 'i' } },
          { 'chargePointModel': { $regex: params.search, $options: 'i' } },
          { 'chargePointVendor': { $regex: params.search, $options: 'i' } }
        ]
      });
    }
    // With no Site Area
    if (params.withNoSiteArea) {
      // Build filter
      filters.$and.push({
        'siteAreaID': null
      });
    } else {
      // Query by siteAreaID
      if (params.siteAreaID) {
        // Build filter
        filters.$and.push({
          'siteAreaID': Utils.convertToObjectID(params.siteAreaID)
        });
      }
      // Site Area
      DatabaseUtils.pushSiteAreaLookupInAggregation(
        { tenantID, aggregation: siteAreaJoin, localField: 'siteAreaID', foreignField: '_id',
          asField: 'siteArea', oneToOneCardinality: true, objectIDFields: ['createdBy', 'lastChangedBy'] });
    }
    // Check Site ID
    if (params.siteIDs && Array.isArray(params.siteIDs) && params.siteIDs.length > 0) {
      // If sites but no site area, no results can be found - return early.
      if (params.withNoSiteArea) {
        return { count: 0, result: [] };
      }
      // Build filter
      siteAreaJoin.push({ $match: {
        'siteArea.siteID': {
          // Still ObjectId because we need it for the site inclusion
          $in: params.siteIDs.map((id) => Utils.convertToObjectID(id))
        }
      } });
    }
    if (params.withSite && !params.withNoSiteArea) {
      // Site
      DatabaseUtils.pushSiteLookupInAggregation(
        { tenantID, aggregation: siteJoin, localField: 'siteArea.siteID', foreignField: '_id',
          asField: 'siteArea.site', oneToOneCardinality: true });
      // Convert siteID back to string after having queried the site
      DatabaseUtils.convertObjectIDToString(siteJoin, 'siteArea.siteID', 'siteArea.siteID');
    }
    // Build facets meaning each different error scenario
    let facets: any = { $facet:{} };
    if (params.errorType && !params.errorType.includes('all')) {
      // Check allowed
      if (!Utils.isTenantComponentActive(await TenantStorage.getTenant(tenantID), Constants.COMPONENTS.ORGANIZATION) && params.errorType.includes('missingSiteArea')) {
        throw new BackendError(null, 'Organization is not active whereas filter is on missing site.',
          'ChargingStationStorage', 'getChargingStationsInError');
      }
      // Build facet only for one error type
      facets.$facet = {};
      params.errorType.forEach((type) => {
        facets.$facet[type] = ChargingStationStorage._buildChargerInErrorFacet(type);
      });
    } else if (params.errorType && params.errorType.includes('all')) {
      facets = {
        '$facet':
        {
          'missingSettings': ChargingStationStorage._buildChargerInErrorFacet('missingSettings'),
          'connectionBroken': ChargingStationStorage._buildChargerInErrorFacet('connectionBroken'),
          'connectorError': ChargingStationStorage._buildChargerInErrorFacet('connectorError'),
        }
      };
      if (Utils.isTenantComponentActive(await TenantStorage.getTenant(tenantID), Constants.COMPONENTS.ORGANIZATION)) {
        // Add facet for missing Site Area ID
        facets.$facet.missingSiteArea = ChargingStationStorage._buildChargerInErrorFacet('missingSiteArea');
      }
    }
    // Merge in each facet the join for sitearea and siteareaid
    const project = [];
    for (const facet in facets.$facet) {
      if (siteAreaJoin.length > 0) {
        facets.$facet[facet] = [...facets.$facet[facet], ...siteAreaJoin];
      }
      if (siteJoin.length > 0) {
        facets.$facet[facet] = [...facets.$facet[facet], ...siteJoin];
        // Filters
        facets.$facet[facet].push({
          $match: filters
        });
      }
      project.push(`$${facet}`);
    }
    if (params.errorType) {
      aggregation.push(facets);
      // Manipulate the results to convert it to an array of document on root level
      aggregation.push({ $project: { 'allItems': { $concatArrays: project } } });
      aggregation.push({ $unwind: { 'path': '$allItems' } });
      aggregation.push({ $replaceRoot: { newRoot: '$allItems' } });
      // Add a unique identifier as we may have the same charger several time
      aggregation.push({ $addFields: { 'uniqueId': { $concat: ['$_id', '#', '$errorCode'] } } });
    } else {
      aggregation = aggregation.concat([{ $match: filters }]).concat(siteAreaJoin).concat(siteJoin);
    }
    // Limit records?
    if (!dbParams.onlyRecordCount) {
      // Always limit the nbr of record to avoid perfs issues
      aggregation.push({ $limit: Constants.DB_RECORD_COUNT_CEIL });
    }
    // Count Records
    const chargingStationsCountMDB = await global.database.getCollection<any>(tenantID, 'chargingstations')
      .aggregate([...aggregation, { $count: 'count' }])
      .toArray();
    // Check if only the total count is requested
    if (dbParams.onlyRecordCount) {
      // Return only the count
      return {
        count: (chargingStationsCountMDB.length > 0 ? chargingStationsCountMDB[0].count : 0),
        result: []
      };
    }
    // Remove the limit
    aggregation.pop();
    // Add Created By / Last Changed By
    DatabaseUtils.pushCreatedLastChangedInAggregation(tenantID, aggregation);
    // Change ID
    DatabaseUtils.renameDatabaseID(aggregation);
    // Sort
    if (dbParams.sort) {
      // Sort
      aggregation.push({
        $sort: dbParams.sort
      });
    } else {
      // Default
      aggregation.push({
        $sort: {
          id: 1
        }
      });
    }
    // Skip
    aggregation.push({
      $skip: dbParams.skip
    });
    // Limit
    aggregation.push({
      $limit: dbParams.limit
    });
    // Project
    DatabaseUtils.projectFields(aggregation, projectFields);
    // Read DB
    const chargingStationsFacetMDB = await global.database.getCollection<ChargingStation>(tenantID, 'chargingstations')
      .aggregate(aggregation, {
        collation: {
          locale: Constants.DEFAULT_LOCALE,
          strength: 2
        }
      })
      .toArray();
    if (chargingStationsCountMDB.length > 0) {
      for (const chargingStation of chargingStationsFacetMDB) {
        // Add clean connectors in case of corrupted DB
        if (!chargingStation.connectors) {
          chargingStation.connectors = [];
        // Clean broken connectors
        } else {
          const cleanedConnectors = [];
          for (const connector of chargingStation.connectors) {
            if (connector) {
              cleanedConnectors.push(connector);
            }
          }
          // TODO Clean them a bit more?
          chargingStation.connectors = cleanedConnectors;
        }
        // Add Inactive flag
        chargingStation.inactive = Utils.getIfChargingStationIsInactive(chargingStation);
      }
    }
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'getChargingStations', uniqueTimerID);
    // Ok
    return {
      count: (chargingStationsCountMDB.length > 0 ?
        (chargingStationsCountMDB[0].count === Constants.DB_RECORD_COUNT_CEIL ? -1 : chargingStationsCountMDB[0].count) : 0),
      result: chargingStationsFacetMDB
    };
  }

  public static async saveChargingStation(tenantID: string, chargingStationToSave: Partial<ChargingStation>): Promise<string> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'saveChargingStation');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    // Check if ID is provided
    UtilsService.assertIdIsProvided(chargingStationToSave.id, 'ChargingStationStorage', 'saveChargingStation', null);
    // Build Request
    const chargingStationFilter = {
      _id: chargingStationToSave.id
    };
    // Properties to save
    const chargingStationMDB = {
      _id: chargingStationToSave.id,
      siteAreaID: Utils.convertToObjectID(chargingStationToSave.siteAreaID),
      chargePointSerialNumber: chargingStationToSave.chargePointSerialNumber,
      chargePointModel: chargingStationToSave.chargePointModel,
      chargeBoxSerialNumber: chargingStationToSave.chargeBoxSerialNumber,
      chargePointVendor: chargingStationToSave.chargePointVendor,
      iccid: chargingStationToSave.iccid,
      imsi: chargingStationToSave.imsi,
      meterType: chargingStationToSave.meterType,
      firmwareVersion: chargingStationToSave.firmwareVersion,
      meterSerialNumber: chargingStationToSave.meterSerialNumber,
      endpoint: chargingStationToSave.endpoint,
      ocppVersion: chargingStationToSave.ocppVersion,
      ocppProtocol: chargingStationToSave.ocppProtocol,
      cfApplicationIDAndInstanceIndex: chargingStationToSave.cfApplicationIDAndInstanceIndex,
      lastHeartBeat: chargingStationToSave.lastHeartBeat,
      deleted: chargingStationToSave.deleted,
      inactive: chargingStationToSave.inactive,
      lastReboot: chargingStationToSave.lastReboot,
      chargingStationURL: chargingStationToSave.chargingStationURL,
      numberOfConnectedPhase: chargingStationToSave.numberOfConnectedPhase,
      maximumPower: chargingStationToSave.maximumPower,
      cannotChargeInParallel: chargingStationToSave.cannotChargeInParallel,
      powerLimitUnit: chargingStationToSave.powerLimitUnit,
      latitude: chargingStationToSave.latitude,
      longitude: chargingStationToSave.longitude,
      connectors: chargingStationToSave.connectors,
      currentIPAddress: chargingStationToSave.currentIPAddress
    };
    if (!chargingStationMDB.connectors) {
      chargingStationMDB.connectors = [];
    }
    // Add Created/LastChanged By
    DatabaseUtils.addLastChangedCreatedProps(chargingStationMDB, chargingStationToSave);
    // Modify and return the modified document
    const result = await global.database.getCollection<any>(tenantID, 'chargingstations').findOneAndUpdate(
      chargingStationFilter,
      { $set: chargingStationMDB },
      { upsert: true });
    if (!result.ok) {
      throw new BackendError(
        Constants.CENTRAL_SERVER,
        'Couldn\'t update ChargingStation',
        'ChargingStationStorage', 'saveChargingStation');
    }
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'saveChargingStation', uniqueTimerID);
    return chargingStationMDB._id;
  }

  public static async saveChargingStationConnector(tenantID: string, chargingStation: ChargingStation, connector: Connector): Promise<void> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'saveChargingStationConnector');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    const updatedFields: any = {};
    updatedFields['connectors.' + (connector.connectorId - 1)] = connector;
    // Update model
    chargingStation.connectors[connector.connectorId - 1] = connector;
    // Modify and return the modified document
    const result = await global.database.getCollection<any>(tenantID, 'chargingstations').findOneAndUpdate(
      { '_id': chargingStation.id },
      { $set: updatedFields },
      { upsert: true });
    if (!result.ok) {
      throw new BackendError(
        Constants.CENTRAL_SERVER,
        'Couldn\'t update ChargingStation connector',
        'ChargingStationStorage', 'saveChargingStationConnector');
    }
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'saveChargingStationConnector', uniqueTimerID);
  }

  public static async saveChargingStationHeartBeat(tenantID: string, chargingStation: ChargingStation): Promise<void> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'saveChargingStationHeartBeat');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    // Set data
    const updatedFields: any = {};
    updatedFields['lastHeartBeat'] = Utils.convertToDate(chargingStation.lastHeartBeat);
    updatedFields['currentIPAddress'] = chargingStation.currentIPAddress;
    // Modify and return the modified document
    const result = await global.database.getCollection<any>(tenantID, 'chargingstations').findOneAndUpdate(
      { '_id': chargingStation.id },
      { $set: updatedFields },
      { upsert: true });
    if (!result.ok) {
      throw new BackendError(
        Constants.CENTRAL_SERVER,
        'Couldn\'t update ChargingStation heartbeat',
        'ChargingStationStorage', 'saveChargingStationHeartBeat');
    }
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'saveChargingStationHeartBeat', uniqueTimerID);
  }

  public static async deleteChargingStation(tenantID: string, id: string): Promise<void> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'deleteChargingStation');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    // Delete Configuration
    await global.database.getCollection<any>(tenantID, 'configurations')
      .findOneAndDelete({ '_id': id });
    // Delete Charger
    await global.database.getCollection<any>(tenantID, 'chargingstations')
      .findOneAndDelete({ '_id': id });
    // Keep the rest (bootnotif, authorize...)
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'deleteChargingStation', uniqueTimerID);
  }

  public static async getConfigurationParamValue(tenantID: string, chargeBoxID: string, paramName: string) {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'getConfigurationParamValue');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    // Get the config
    const configuration = await ChargingStationStorage.getConfiguration(tenantID, chargeBoxID);
    let value = null;
    if (configuration) {
      // Get the value
      configuration.configuration.every((param) => {
        // Check
        if (param.key === paramName) {
          value = param.value;
          return false;
        }
        return true;
      });
    }
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'getConfigurationParamValue', uniqueTimerID);
    return value;
  }

  public static async getConfiguration(tenantID: string, chargeBoxID: string): Promise<{id: string; timestamp: Date; configuration: any}> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'getConfiguration');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    // Read DB
    const configurationsMDB = await global.database.getCollection<any>(tenantID, 'configurations')
      .findOne({
        '_id': chargeBoxID
      });
    // Found?
    let configuration = null;
    if (configurationsMDB && configurationsMDB.length > 0) {
      // Set values
      configuration = {
        id: configurationsMDB._id.toHexString(),
        timestamp: Utils.convertToDate(configurationsMDB.timestamp),
        configuration: configurationsMDB.configuration
      };
    }
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'getConfiguration', uniqueTimerID);
    return configuration;
  }

  public static async removeChargingStationsFromSiteArea(tenantID: string, siteAreaID: string, chargingStationIDs: string[]): Promise<void> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'removeChargingStationsFromSiteArea');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    // Site provided?
    if (siteAreaID) {
      // At least one ChargingStation
      if (chargingStationIDs && chargingStationIDs.length > 0) {
        // Update all chargers
        await global.database.getCollection<any>(tenantID, 'chargingstations').updateMany({
          $and: [
            { '_id': { $in: chargingStationIDs } },
            { 'siteAreaID': Utils.convertToObjectID(siteAreaID) }
          ]
        }, {
          $set: { siteAreaID: null }
        }, {
          upsert: false
        });
      }
    }
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'removeChargingStationsFromSiteArea', uniqueTimerID, {
      siteAreaID,
      chargingStationIDs
    });
  }

  public static async addChargingStationsToSiteArea(tenantID: string, siteAreaID: string, chargingStationIDs: string[]): Promise<void> {
    // Debug
    const uniqueTimerID = Logging.traceStart('ChargingStationStorage', 'addChargingStationsToSiteArea');
    // Check Tenant
    await Utils.checkTenant(tenantID);
    // Site provided?
    if (siteAreaID) {
      // At least one ChargingStation
      if (chargingStationIDs && chargingStationIDs.length > 0) {
        // Update all chargers
        await global.database.getCollection<any>(tenantID, 'chargingstations').updateMany({
          $and: [
            { '_id': { $in: chargingStationIDs } },
            { 'siteAreaID': null }
          ]
        }, {
          $set: { siteAreaID: Utils.convertToObjectID(siteAreaID) }
        }, {
          upsert: false
        });
      }
    }
    // Debug
    Logging.traceEnd('ChargingStationStorage', 'addChargingStationsToSiteArea', uniqueTimerID, {
      siteAreaID,
      chargingStationIDs
    });
  }

  private static _buildChargerInErrorFacet(errorType: 'missingSettings'|'connectionBroken'|'connectorError'|'missingSiteArea'|'all') {
    switch (errorType) {
      case 'all': return [];
      case 'missingSettings':
        return [{
          $match: {
            $or: [
              { 'maximumPower': { $exists: false } }, { 'maximumPower': { $lte: 0 } }, { 'maximumPower': null },
              { 'chargePointModel': { $exists: false } }, { 'chargePointModel': { $eq: '' } },
              { 'chargePointVendor': { $exists: false } }, { 'chargePointVendor': { $eq: '' } },
              { 'numberOfConnectedPhase': { $exists: false } }, { 'numberOfConnectedPhase': null }, { 'numberOfConnectedPhase': { $nin: [0, 1, 3] } },
              { 'powerLimitUnit': { $exists: false } }, { 'powerLimitUnit': null }, { 'powerLimitUnit': { $nin: ['A', 'W'] } },
              { 'chargingStationURL': { $exists: false } }, { 'chargingStationURL': null }, { 'chargingStationURL': { $eq: '' } },
              { 'cannotChargeInParallel': { $exists: false } }, { 'cannotChargeInParallel': null },
              { 'connectors.type': { $exists: false } }, { 'connectors.type': null }, { 'connectors.type': { $eq: '' } },
              { 'connectors.power': { $exists: false } }, { 'connectors.power': null }, { 'connectors.power': { $lte: 0 } }
            ]
          }
        },
        { $addFields: { 'errorCode': 'missingSettings' } }
        ];
      case 'connectionBroken': {
        const inactiveDate = new Date(new Date().getTime() - 3 * 60 * 1000);
        return [
          { $match: { 'lastHeartBeat': { $lte: inactiveDate } } },
          { $addFields: { 'errorCode': 'connectionBroken' } }
        ];
      }
      case 'connectorError':
        return [
          { $match: { $or: [{ 'connectors.errorCode': { $ne: 'NoError' } }, { 'connectors.status': { $eq: 'Faulted' } }] } },
          { $addFields: { 'errorCode': 'connectorError' } }
        ];
      case 'missingSiteArea':
        return [
          { $match: { $or: [{ 'siteAreaID': { $exists: false } }, { 'siteAreaID': null }] } },
          { $addFields: { 'errorCode': 'missingSiteArea' } }
        ];
      default:
        return [];
    }
  }
}
