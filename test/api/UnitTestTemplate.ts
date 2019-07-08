import chai, { expect } from 'chai';
import chaiDatetime from 'chai-datetime';
import chaiSubset from 'chai-subset';
import moment from 'moment';
import responseHelper from '../helpers/responseHelper';
import CONTEXTS from './contextProvider/ContextConstants';
import ContextProvider from './contextProvider/ContextProvider';

chai.use(chaiDatetime);
chai.use(chaiSubset);
chai.use(responseHelper);

// For Visual Studio it is recommended to install Mocha sidebar and Chai snippets
// Mocha is the test framework and chai provides functions to check expectations

describe('Template for Dev Unit Test', function() {
  this.timeout(10000); // Not mandatory will automatically stop the unit test after that period of time

  before(async () => {
    chai.config.includeStack = true;
    // Used to prepare data before the whole test chain is started
    await ContextProvider.DefaultInstance.prepareContexts();
  });

  afterEach(() => {
    // Should be called after each UT to clean up created data
    ContextProvider.DefaultInstance.cleanUpCreatedContent();
  });

  after(async () => {
    // Can be called at the end to ensure proper data clean up
    // ContextProvider.cleanUpCreatedContent();
  });

  describe('Usage of tenant context with all components', () => {
    it('Basic charging station transaction', async () => {
      const tenantContextAll = await ContextProvider.DefaultInstance.getTenantContext(CONTEXTS.TENANT_CONTEXTS.TENANT_WITH_ALL_COMPONENTS);
      const user = tenantContextAll.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER);
      const siteContext = tenantContextAll.getSiteContext(CONTEXTS.SITE_CONTEXTS.SITE_BASIC);
      const siteAreaContext = siteContext.getSiteAreaContext(CONTEXTS.SITE_AREA_CONTEXTS.WITH_ACL);
      const chargingStationContext = siteAreaContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.ASSIGNED_OCPP15);
      const response = await chargingStationContext.startTransaction(1, user.tagIDs[0], 0, moment());
      expect(response).to.be.transactionValid;
      const userCentralService = tenantContextAll.getUserCentralServerService(CONTEXTS.USER_CONTEXTS.BASIC_USER);
      const tenantListResponse = await userCentralService.transactionApi.readAllActive({});
    });

    it('usage of non assigned CS', async () => {
      const tenantContextAll = await ContextProvider.DefaultInstance.getTenantContext(CONTEXTS.TENANT_CONTEXTS.TENANT_WITH_ALL_COMPONENTS);
      const user = tenantContextAll.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER);
      const siteContext = tenantContextAll.getSiteContext(CONTEXTS.SITE_CONTEXTS.NO_SITE);
      const siteAreaContext = siteContext.getSiteAreaContext(CONTEXTS.SITE_AREA_CONTEXTS.NO_SITE);
      const chargingStationContext = siteAreaContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.UNASSIGNED_OCPP16);
      const response = await chargingStationContext.startTransaction(1, user.tagIDs[0], 0, moment());
      expect(response).to.be.transactionStatus('Rejected');
    });

  });

  describe('usage of non assigned CS', () => {
  });
});

function timeout(ms) {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });
}
