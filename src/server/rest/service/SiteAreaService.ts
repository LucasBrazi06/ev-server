import { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import Authorizations from '../../../authorization/Authorizations';
import AppAuthError from '../../../exception/AppAuthError';
import AppError from '../../../exception/AppError';
import SmartChargingFactory from '../../../integration/smart-charging/SmartChargingFactory';
import ConsumptionStorage from '../../../storage/mongodb/ConsumptionStorage';
import SiteAreaStorage from '../../../storage/mongodb/SiteAreaStorage';
import SiteStorage from '../../../storage/mongodb/SiteStorage';
import { Action, Entity } from '../../../types/Authorization';
import { ChargingProfilePurposeType } from '../../../types/ChargingProfile';
import { ActionsResponse } from '../../../types/GlobalType';
import { HTTPAuthError, HTTPError } from '../../../types/HTTPError';
import SiteArea from '../../../types/SiteArea';
import TenantComponents from '../../../types/TenantComponents';
import Constants from '../../../utils/Constants';
import Logging from '../../../utils/Logging';
import Utils from '../../../utils/Utils';
import OCPPUtils from '../../ocpp/utils/OCPPUtils';
import SiteAreaSecurity from './security/SiteAreaSecurity';
import UtilsService from './UtilsService';

const MODULE_NAME = 'SiteAreaService';

export default class SiteAreaService {
  public static async handleDeleteSiteArea(action: Action, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.ORGANIZATION,
      Action.DELETE, Entity.SITE_AREA, MODULE_NAME, 'handleDeleteSiteArea');
    // Filter
    const siteAreaID = SiteAreaSecurity.filterSiteAreaRequestByID(req.query);
    // Check Mandatory fields
    UtilsService.assertIdIsProvided(action, siteAreaID, MODULE_NAME, 'handleDeleteSiteArea', req.user);
    // Get
    const siteArea = await SiteAreaStorage.getSiteArea(req.user.tenantID, siteAreaID);
    // Found?
    UtilsService.assertObjectExists(action, siteArea, `Site Area with ID '${siteAreaID}' does not exist`,
      MODULE_NAME, 'handleDeleteSiteArea', req.user);
    // Check auth
    if (!Authorizations.canDeleteSiteArea(req.user, siteArea.siteID)) {
      throw new AppAuthError({
        errorCode: HTTPAuthError.ERROR,
        user: req.user,
        action: Action.DELETE,
        entity: Entity.SITE_AREA,
        module: MODULE_NAME,
        method: 'handleDeleteSiteArea',
        value: siteAreaID
      });
    }
    // Delete
    await SiteAreaStorage.deleteSiteArea(req.user.tenantID, siteArea.id);
    // Log
    Logging.logSecurityInfo({
      tenantID: req.user.tenantID,
      user: req.user, module: MODULE_NAME, method: 'handleDeleteSiteArea',
      message: `Site Area '${siteArea.name}' has been deleted successfully`,
      action: action,
      detailedMessages: { siteArea }
    }
    );
    // Ok
    res.json(Constants.REST_RESPONSE_SUCCESS);
    next();
  }

  public static async handleGetSiteArea(action: Action, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.ORGANIZATION,
      Action.READ, Entity.SITE_AREA, MODULE_NAME, 'handleGetSiteArea');
    // Filter
    const filteredRequest = SiteAreaSecurity.filterSiteAreaRequest(req.query);
    // ID is mandatory
    UtilsService.assertIdIsProvided(action, filteredRequest.ID, MODULE_NAME, 'handleGetSiteArea', req.user);
    // Get it
    const siteArea = await SiteAreaStorage.getSiteArea(req.user.tenantID, filteredRequest.ID,
      { withSite: filteredRequest.WithSite, withChargeBoxes: filteredRequest.WithChargeBoxes });
    // Found?
    UtilsService.assertObjectExists(action, siteArea, `Site Area with ID '${filteredRequest.ID}' does not exist`,
      MODULE_NAME, 'handleGetSiteArea', req.user);
    // Check auth
    if (!Authorizations.canReadSiteArea(req.user, siteArea.siteID)) {
      throw new AppAuthError({
        errorCode: HTTPAuthError.ERROR,
        user: req.user,
        action: Action.READ,
        entity: Entity.SITE_AREA,
        module: MODULE_NAME,
        method: 'handleGetSiteArea',
        value: filteredRequest.ID
      });
    }
    // Return
    res.json(
      // Filter
      SiteAreaSecurity.filterSiteAreaResponse(siteArea, req.user)
    );
    next();
  }

  public static async handleGetSiteAreaImage(action: Action, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.ORGANIZATION,
      Action.READ, Entity.SITE_AREA, MODULE_NAME, 'handleGetSiteAreaImage');
    // Filter
    const siteAreaID = SiteAreaSecurity.filterSiteAreaRequestByID(req.query);
    // Charge Box is mandatory
    UtilsService.assertIdIsProvided(action, siteAreaID, MODULE_NAME, 'handleGetSiteAreaImage', req.user);
    // Get it
    const siteArea = await SiteAreaStorage.getSiteArea(req.user.tenantID, siteAreaID);
    UtilsService.assertObjectExists(action, siteArea, `Site Area with ID '${siteAreaID}' does not exist`,
      MODULE_NAME, 'handleGetSiteAreaImage', req.user);
    // Check auth
    if (!Authorizations.canReadSiteArea(req.user, siteArea.siteID)) {
      throw new AppAuthError({
        errorCode: HTTPAuthError.ERROR,
        user: req.user,
        action: Action.READ,
        entity: Entity.SITE_AREA,
        module: MODULE_NAME,
        method: 'handleGetSiteAreaImage',
        value: siteAreaID
      });
    }
    // Get it
    const siteAreaImage = await SiteAreaStorage.getSiteAreaImage(req.user.tenantID, siteAreaID);
    UtilsService.assertObjectExists(action, siteAreaImage, `Site Area Image with ID '${siteAreaID}' does not exist`,
      MODULE_NAME, 'handleGetSiteAreaImage', req.user);
    // Return
    res.json({ id: siteAreaImage.id, image: siteAreaImage.image });
    next();
  }

  public static async handleGetSiteAreas(action: Action, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.ORGANIZATION,
      Action.LIST, Entity.SITE_AREAS, MODULE_NAME, 'handleGetSiteAreas');
    // Check auth
    if (!Authorizations.canListSiteAreas(req.user)) {
      throw new AppAuthError({
        errorCode: HTTPAuthError.ERROR,
        user: req.user,
        action: Action.LIST,
        entity: Entity.SITE_AREAS,
        module: MODULE_NAME,
        method: 'handleGetSiteAreas'
      });
    }
    // Filter
    const filteredRequest = SiteAreaSecurity.filterSiteAreasRequest(req.query);
    // Get the sites
    const siteAreas = await SiteAreaStorage.getSiteAreas(req.user.tenantID,
      {
        issuer: filteredRequest.Issuer,
        search: filteredRequest.Search,
        withSite: filteredRequest.WithSite,
        withChargeBoxes: filteredRequest.WithChargeBoxes,
        withAvailableChargers: filteredRequest.WithAvailableChargers,
        siteIDs: Authorizations.getAuthorizedSiteIDs(req.user, filteredRequest.SiteID ? filteredRequest.SiteID.split('|') : null),
      },
      { limit: filteredRequest.Limit, skip: filteredRequest.Skip, sort: filteredRequest.Sort, onlyRecordCount: filteredRequest.OnlyRecordCount },
      ['id', 'name', 'siteID', 'address.coordinates', 'address.city', 'address.country', 'site.id', 'site.name', 'issuer']
    );
    // Filter
    SiteAreaSecurity.filterSiteAreasResponse(siteAreas, req.user);
    // Return
    res.json(siteAreas);
    next();
  }

  public static async handleGetSiteAreaConsumption(action: Action, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.ORGANIZATION,
      Action.LIST, Entity.SITE_AREAS, MODULE_NAME, 'handleGetSiteAreaConsumption');
    // Filter
    const filteredRequest = SiteAreaSecurity.filterSiteAreaConsumptionRequest(req.query);
    UtilsService.assertIdIsProvided(action, filteredRequest.siteAreaId, MODULE_NAME,
      'handleGetConsumptionFromTransaction', req.user);
    // Check auth
    if (!Authorizations.canListSiteAreas(req.user)) {
      throw new AppAuthError({
        errorCode: HTTPAuthError.ERROR,
        user: req.user,
        action: Action.LIST,
        entity: Entity.SITE_AREAS,
        module: MODULE_NAME,
        method: 'handleGetSiteAreaConsumption'
      });
    }
    // Check dates
    if (!filteredRequest.startDate || !filteredRequest.endDate) {
      throw new AppError({
        source: Constants.CENTRAL_SERVER,
        errorCode: HTTPError.GENERAL_ERROR,
        message: 'Start date and end date must be provided',
        module: MODULE_NAME,
        method: 'handleGetSiteAreaConsumption',
        user: req.user,
        action: action
      });
    }
    // Check dates order
    if (filteredRequest.startDate &&
        filteredRequest.endDate &&
        moment(filteredRequest.startDate).isAfter(moment(filteredRequest.endDate))) {
      throw new AppError({
        source: Constants.CENTRAL_SERVER,
        errorCode: HTTPError.GENERAL_ERROR,
        message: `The requested start date '${new Date(filteredRequest.startDate).toISOString()}' is after the requested end date '${new Date(filteredRequest.endDate).toISOString()}' `,
        module: MODULE_NAME,
        method: 'handleGetSiteAreaConsumption',
        user: req.user,
        action: action
      });
    }
    // Get the ConsumptionValues
    const siteAreaConsumptionValues = await ConsumptionStorage.getSiteAreaConsumption(req.user.tenantID,
      {
        siteAreaId: filteredRequest.siteAreaId,
        startDate: filteredRequest.startDate,
        endDate: filteredRequest.endDate
      },
    );
    // Get the Site Area Limit
    const siteArea = await SiteAreaStorage.getSiteArea(req.user.tenantID, filteredRequest.siteAreaId);
    const siteAreaLimit = siteArea.maximumPower;
    // Return
    res.json(SiteAreaSecurity.filterSiteAreaConsumptionResponse(
      siteAreaConsumptionValues, siteAreaLimit, filteredRequest.siteAreaId));
    next();
  }

  public static async handleCreateSiteArea(action: Action, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.ORGANIZATION,
      Action.CREATE, Entity.SITE_AREAS, MODULE_NAME, 'handleCreateSiteArea');
    // Filter
    const filteredRequest = SiteAreaSecurity.filterSiteAreaCreateRequest(req.body);
    // Check
    Utils.checkIfSiteAreaValid(filteredRequest, req);
    // Check auth
    if (!Authorizations.canCreateSiteArea(req.user, filteredRequest.siteID)) {
      throw new AppAuthError({
        errorCode: HTTPAuthError.ERROR,
        user: req.user,
        action: Action.CREATE,
        entity: Entity.SITE_AREA,
        module: MODULE_NAME,
        method: 'handleCreateSiteArea'
      });
    }
    // Check Site
    const site = await SiteStorage.getSite(req.user.tenantID, filteredRequest.siteID);
    UtilsService.assertObjectExists(action, site, `Site ID '${filteredRequest.siteID}' does not exist`,
      MODULE_NAME, 'handleCreateSiteArea', req.user);
    // Create site
    const newSiteArea: SiteArea = {
      ...filteredRequest,
      issuer: true,
      createdBy: { id: req.user.id },
      createdOn: new Date()
    } as SiteArea;
    // Save
    newSiteArea.id = await SiteAreaStorage.saveSiteArea(req.user.tenantID, newSiteArea, true);
    Logging.logSecurityInfo({
      tenantID: req.user.tenantID,
      user: req.user, module: MODULE_NAME, method: 'handleCreateSiteArea',
      message: `Site Area '${newSiteArea.name}' has been created successfully`,
      action: action,
      detailedMessages: { siteArea: newSiteArea }
    });
    // Ok
    res.json(Object.assign({ id: newSiteArea.id }, Constants.REST_RESPONSE_SUCCESS));
    next();
  }

  public static async handleUpdateSiteArea(action: Action, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.ORGANIZATION,
      Action.UPDATE, Entity.SITE_AREA, MODULE_NAME, 'handleUpdateSiteArea');
    // Filter
    const filteredRequest = SiteAreaSecurity.filterSiteAreaUpdateRequest(req.body);
    // Get
    const siteArea = await SiteAreaStorage.getSiteArea(req.user.tenantID, filteredRequest.id, { withChargeBoxes: true });
    UtilsService.assertObjectExists(action, siteArea, `Site Area with ID '${filteredRequest.id}' does not exist`,
      MODULE_NAME, 'handleUpdateSiteArea', req.user);
    // Check auth
    if (!Authorizations.canUpdateSiteArea(req.user, siteArea.siteID)) {
      throw new AppAuthError({
        errorCode: HTTPAuthError.ERROR,
        user: req.user,
        action: Action.UPDATE,
        entity: Entity.SITE_AREA,
        module: MODULE_NAME,
        method: 'handleUpdateSiteArea',
        value: filteredRequest.id
      });
    }
    // Check Mandatory fields
    Utils.checkIfSiteAreaValid(filteredRequest, req);
    // Check Site
    const site = await SiteStorage.getSite(req.user.tenantID, filteredRequest.siteID);
    UtilsService.assertObjectExists(action, site, `Site ID '${filteredRequest.siteID}' does not exist`,
      MODULE_NAME, 'handleUpdateSiteArea', req.user);
    // Update
    siteArea.name = filteredRequest.name;
    siteArea.address = filteredRequest.address;
    siteArea.image = filteredRequest.image;
    const siteAreaMaxPowerHasChanged = siteArea.maximumPower !== filteredRequest.maximumPower;
    siteArea.maximumPower = filteredRequest.maximumPower;
    let actionsResponse: ActionsResponse;
    if (siteArea.smartCharging && !filteredRequest.smartCharging) {
      actionsResponse = await OCPPUtils.clearAndDeleteChargingProfilesForSiteArea(
        req.user.tenantID, siteArea,
        { profilePurposeType : ChargingProfilePurposeType.TX_PROFILE });
    }
    siteArea.smartCharging = filteredRequest.smartCharging;
    siteArea.accessControl = filteredRequest.accessControl;
    siteArea.siteID = filteredRequest.siteID;
    siteArea.lastChangedBy = { 'id': req.user.id };
    siteArea.lastChangedOn = new Date();
    // Update Site Area
    await SiteAreaStorage.saveSiteArea(req.user.tenantID, siteArea, true);
    // Regtrigger Smart Charging
    if (siteAreaMaxPowerHasChanged && filteredRequest.smartCharging) {
      setTimeout(async () => {
        try {
          const smartCharging = await SmartChargingFactory.getSmartChargingImpl(req.user.tenantID);
          if (smartCharging) {
            await smartCharging.computeAndApplyChargingProfiles(siteArea);
          }
        } catch (error) {
          Logging.logError({
            tenantID: req.user.tenantID,
            source: Constants.CENTRAL_SERVER,
            module: MODULE_NAME, method: 'handleUpdateSiteArea',
            action: Action.UPDATE,
            message: 'An error occurred while trying to call smart charging',
            detailedMessages: { error: error.message, stack: error.stack }
          });
        }
      }, Constants.DELAY_SMART_CHARGING_EXECUTION_MILLIS);
    }
    // Log
    Logging.logSecurityInfo({
      tenantID: req.user.tenantID,
      user: req.user, module: MODULE_NAME, method: 'handleUpdateSiteArea',
      message: `Site Area '${siteArea.name}' has been updated successfully`,
      action: action,
      detailedMessages: { siteArea }
    });
    if (actionsResponse && actionsResponse.inError > 0) {
      throw new AppError({
        source: Constants.CENTRAL_SERVER,
        action: action,
        errorCode: HTTPError.CLEAR_CHARGING_PROFILE_NOT_SUCCESSFUL,
        message: 'Error occurred while clearing Charging Profiles for Site Area',
        module: MODULE_NAME, method: 'handleUpdateSiteArea',
        user: req.user, actionOnUser: req.user
      });
    }
    // Ok
    res.json(Constants.REST_RESPONSE_SUCCESS);
    next();
  }
}
