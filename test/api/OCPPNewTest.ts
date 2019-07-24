import chai, { expect } from 'chai';
import chaiDatetime from 'chai-datetime';
import chaiSubset from 'chai-subset';
import responseHelper from '../helpers/responseHelper';
import CentralServerService from './client/CentralServerService';
import CONTEXTS from './contextProvider/ContextConstants';
import ContextProvider from './contextProvider/ContextProvider';
import OCPPCommonTestsNew from './OCPPCommonTestsNew';

chai.use(chaiDatetime);
chai.use(chaiSubset);
chai.use(responseHelper);

class TestData {
  public tenantContext: any;
  public centralUserContext: any;
  public ocppCommonTests: OCPPCommonTestsNew;
  public siteContext: any;
  public siteAreaContext: any;
  public chargingStationContext: any;
}

const testData: TestData = new TestData();

describe('OCPP tests (all versions)', function () {
  this.timeout(300000); // Will automatically stop the unit test after that period of time

  before(async () => {
    chai.config.includeStack = true;
    await ContextProvider.DefaultInstance.prepareContexts();
  });

  afterEach(() => {
    // Can be called after each UT to clean up created data
  });

  after(async () => {
    // Final clean up at the end
    await ContextProvider.DefaultInstance.cleanUpCreatedContent();
  });

  describe('Without any component (tenant ut-nothing)', () => {

    before(async () => {
      testData.tenantContext = await ContextProvider.DefaultInstance.getTenantContext(CONTEXTS.TENANT_CONTEXTS.TENANT_WITH_NO_COMPONENTS);
      testData.centralUserContext = testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN);
      testData.ocppCommonTests = new OCPPCommonTestsNew(testData.tenantContext, testData.centralUserContext, true);

      await testData.ocppCommonTests.before();
    });

    after(async () => {
      await testData.ocppCommonTests.after();
    });

    describe('For OCPP Version 1.5 (SOAP)', () => {

      before(() => {
        testData.chargingStationContext = testData.tenantContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.UNASSIGNED_OCPP15);
        testData.ocppCommonTests.setChargingStation(testData.chargingStationContext);
      });

      after(async () => {
        await testData.chargingStationContext.cleanUpCreatedData();
      });

      describe('Where any user', () => {

        it('With tag as integer should be authorized to start a transaction', async () => {
          await testData.ocppCommonTests.testAuthorizeTagAsInteger();
        });

        it('With invalid tag should not be authorized to start a transaction', async () => {
          await testData.ocppCommonTests.testAuthorizeInvalidTag();
        });

        it('Should be able to start transaction with tag as integer', async () => {
          await testData.ocppCommonTests.testStartTransactionWithTagAsInteger();
        });

        it('Should be able to start a transaction with connectorId as string', async () => {
          await testData.ocppCommonTests.testStartTransactionWithConnectorIdAsString();
        });

        it('Should be able to start a transaction with meterStart as string', async () => {
          await testData.ocppCommonTests.testStartTransactionWithMeterStartAsString();
        });

        it('Should be able to start a transaction with meterStart greater than 0', async () => {
          await testData.ocppCommonTests.testStartTransactionWithMeterStartGreaterZero();
        });

        it('Should not be able to start a transaction with invalid tag', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidTag();
        });

        it('Should not be able to start a transaction with invalid connectorId', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidConnectorId();
        });

        it('Should not be able to start a transaction with invalid meterStart', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidMeterStart();
        });

        it('Should be able to stop a transaction without transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithoutTransactionData();
        });

        it('Should be able to stop a transaction with transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithTransactionData();
        });

        it('Should not be able to stop a transaction with invalid transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithInvalidTransactionData();
        });

        it('Should be able to retrieve the last reboot date', async () => {
          await testData.ocppCommonTests.testRetrieveLastRebootDate();
        });

        it('Should be able to perform a transaction, where Keba clock meterValues are ignored', async () => {
          await testData.ocppCommonTests.testTransactionIgnoringClockMeterValues();
        });

        it('Charging station should set both of its connectors to Available', async () => {
          await testData.ocppCommonTests.testConnectorStatus();
        });

        it('Charging station should send its heartbeat', async () => {
          await testData.ocppCommonTests.testHeartbeat();
        });

        it('Charging station can change its connector status to Occupied', async () => {
          await testData.ocppCommonTests.testChangeConnectorStatus();
        });

        it('Charging station should send data transfer', async () => {
          await testData.ocppCommonTests.testDataTransfer();
        });

      });

      describe('Where basic user', () => {

        before(() => {
          testData.ocppCommonTests.setUsers(
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER_UNASSIGNED)
          );
        });

        it('Should authorize transaction', async () => {
          await testData.ocppCommonTests.testStartTransaction();
        });

      });

      describe('Where admin user', () => {

        before(() => {
          testData.ocppCommonTests.setUsers(
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.ADMIN_UNASSIGNED)
          );
        });

        it('Should authorize transaction', async () => {
          await testData.ocppCommonTests.testStartTransaction();
        });

      });

    });

    describe('For OCPP Version 1.6 (JSON)', () => {

      before(() => {
        testData.chargingStationContext = testData.tenantContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.UNASSIGNED_OCPP16);
        testData.ocppCommonTests.setChargingStation(testData.chargingStationContext);
      });

      after(async () => {
        await testData.chargingStationContext.cleanUpCreatedData();
      });

      describe('Where any user', () => {

        it('With tag as integer should be authorized to start a transaction', async () => {
          await testData.ocppCommonTests.testAuthorizeTagAsInteger();
        });

        it('With invalid tag should not be authorized to start a transaction', async () => {
          await testData.ocppCommonTests.testAuthorizeInvalidTag();
        });

        it('Should be able to start transaction with tag as integer', async () => {
          await testData.ocppCommonTests.testStartTransactionWithTagAsInteger();
        });

        it('Should be able to start a transaction with connectorId as string', async () => {
          await testData.ocppCommonTests.testStartTransactionWithConnectorIdAsString();
        });

        it('Should be able to start a transaction with meterStart as string', async () => {
          await testData.ocppCommonTests.testStartTransactionWithMeterStartAsString();
        });

        it('Should be able to start a transaction with meterStart greater than 0', async () => {
          await testData.ocppCommonTests.testStartTransactionWithMeterStartGreaterZero();
        });

        it('Should not be able to start a transaction with invalid tag', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidTag();
        });

        it('Should not be able to start a transaction with invalid connectorId', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidConnectorId();
        });

        it('Should not be able to start a transaction with invalid meterStart', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidMeterStart();
        });

        it('Should be able to stop a transaction without transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithoutTransactionData();
        });

        it('Should be able to stop a transaction with transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithTransactionData();
        });

        it('Should not be able to stop a transaction with invalid transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithInvalidTransactionData();
        });

        it('Should be able to retrieve the last reboot date', async () => {
          await testData.ocppCommonTests.testRetrieveLastRebootDate();
        });

        it('Should be able to perform a transaction, where Keba clock meterValues are ignored', async () => {
          await testData.ocppCommonTests.testTransactionIgnoringClockMeterValues();
        });

        it('Charging station should set both of its connectors to Available', async () => {
          await testData.ocppCommonTests.testConnectorStatus();
        });

        it('Charging station should send its heartbeat', async () => {
          await testData.ocppCommonTests.testHeartbeat();
        });

        it('Charging station can change its connector status to Occupied', async () => {
          await testData.ocppCommonTests.testChangeConnectorStatus();
        });

        it('Charging station should send data transfer', async () => {
          await testData.ocppCommonTests.testDataTransfer();
        });

      });

      describe('Where basic user', () => {

        before(() => {
          testData.ocppCommonTests.setUsers(
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER_UNASSIGNED)
          );
        });

        it('Should authorize transaction', async () => {
          await testData.ocppCommonTests.testStartTransaction();
        });

      });

      describe('Where admin user', () => {

        before(() => {
          testData.ocppCommonTests.setUsers(
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.ADMIN_UNASSIGNED)
          );
        });

        it('Should authorize transaction', async () => {
          await testData.ocppCommonTests.testStartTransaction();
        });

      });

    });

  });

  describe('With component Organization only (tenant ut-org)', () => {

    before(async () => {
      testData.tenantContext = await ContextProvider.DefaultInstance.getTenantContext(CONTEXTS.TENANT_CONTEXTS.TENANT_ORGANIZATION);
      testData.centralUserContext = testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN);
      testData.ocppCommonTests = new OCPPCommonTestsNew(testData.tenantContext, testData.centralUserContext);

      testData.siteContext = testData.tenantContext.getSiteContext(CONTEXTS.SITE_CONTEXTS.SITE_BASIC);
      testData.siteAreaContext = testData.siteContext.getSiteAreaContext(CONTEXTS.SITE_AREA_CONTEXTS.WITH_ACL);

      await testData.ocppCommonTests.before();
    });

    after(async () => {
      await testData.ocppCommonTests.after();
    });

    describe('For OCPP Version 1.5 (SOAP)', () => {

      describe('With charger assigned to a site area', () => {

        before(() => {
          testData.chargingStationContext = testData.siteAreaContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.ASSIGNED_OCPP15);
          testData.ocppCommonTests.setChargingStation(testData.chargingStationContext);
        });

        after(async () => {
          await testData.chargingStationContext.cleanUpCreatedData();
        });

        describe('Where basic user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER)
            );
          });

          it('Should authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

        });

        describe('Where unassigned basic user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER_UNASSIGNED)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

        describe('Where admin user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN)
            );
          });

          it('Should authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

        });

        describe('Where unassigned admin user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.ADMIN_UNASSIGNED)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

      });

      describe('With charger not assigned to a site area', () => {

        before(() => {
          testData.chargingStationContext = testData.tenantContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.UNASSIGNED_OCPP15);
          testData.ocppCommonTests.setChargingStation(testData.chargingStationContext);
        });

        after(async () => {
          await testData.chargingStationContext.cleanUpCreatedData();
        });

        describe('Where basic user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

        describe('Where unassigned basic user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER_UNASSIGNED)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

        describe('Where admin user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

        describe('Where unassigned admin user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.ADMIN_UNASSIGNED)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

      });

    });

    describe('For OCPP Version 1.6 (JSON)', () => {

      describe('With charger assigned to a site area', () => {

        before(() => {
          testData.chargingStationContext = testData.siteAreaContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.ASSIGNED_OCPP16);
          testData.ocppCommonTests.setChargingStation(testData.chargingStationContext);
        });

        after(async () => {
          await testData.chargingStationContext.cleanUpCreatedData();
        });

        describe('Where basic user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER)
            );
          });

          it('Should authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

        });

        describe('Where unassigned basic user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER_UNASSIGNED)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

        describe('Where admin user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN)
            );
          });

          it('Should authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

        });

        describe('Where unassigned admin user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.ADMIN_UNASSIGNED)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

      });

      describe('With charger not assigned to a site area', () => {

        before(() => {
          testData.chargingStationContext = testData.tenantContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.UNASSIGNED_OCPP16);
          testData.ocppCommonTests.setChargingStation(testData.chargingStationContext);
        });

        after(async () => {
          await testData.chargingStationContext.cleanUpCreatedData();
        });

        describe('Where basic user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

        describe('Where unassigned basic user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER_UNASSIGNED)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

        describe('Where admin user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

        describe('Where unassigned admin user', () => {

          before(() => {
            testData.ocppCommonTests.setUsers(
              testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.ADMIN_UNASSIGNED)
            );
          });

          it('Should not authorize transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction(false, false);
          });

        });

      });

    });

  });

  describe('With components Organization and Pricing (tenant ut-all)', () => {

    before(async () => {
      testData.tenantContext = await ContextProvider.DefaultInstance.getTenantContext(CONTEXTS.TENANT_CONTEXTS.TENANT_WITH_ALL_COMPONENTS);
      testData.centralUserContext = testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN);
      testData.ocppCommonTests = new OCPPCommonTestsNew(testData.tenantContext, testData.centralUserContext, true);

      testData.siteContext = testData.tenantContext.getSiteContext(CONTEXTS.SITE_CONTEXTS.SITE_BASIC);
      testData.siteAreaContext = testData.siteContext.getSiteAreaContext(CONTEXTS.SITE_AREA_CONTEXTS.WITH_ACL);

      await testData.ocppCommonTests.before();
      await testData.ocppCommonTests.assignAnyUserToSite(testData.siteContext);
    });

    after(async () => {
      await testData.ocppCommonTests.after();
    });

    describe('For OCPP Version 1.5 (SOAP)', () => {

      before(() => {
        testData.chargingStationContext = testData.siteAreaContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.ASSIGNED_OCPP15);
        testData.ocppCommonTests.setChargingStation(testData.chargingStationContext);
      });

      after(async () => {
        await testData.chargingStationContext.cleanUpCreatedData();
      });
      describe('Where any user', () => {

        it('With tag as integer should be authorized to start a transaction', async () => {
          await testData.ocppCommonTests.testAuthorizeTagAsInteger();
        });

        it('With invalid tag should not be authorized to start a transaction', async () => {
          await testData.ocppCommonTests.testAuthorizeInvalidTag();
        });

        it('Should be able to start transaction with tag as integer', async () => {
          await testData.ocppCommonTests.testStartTransactionWithTagAsInteger();
        });

        it('Should be able to start a transaction with connectorId as string', async () => {
          await testData.ocppCommonTests.testStartTransactionWithConnectorIdAsString();
        });

        it('Should be able to start a transaction with meterStart as string', async () => {
          await testData.ocppCommonTests.testStartTransactionWithMeterStartAsString();
        });

        it('Should be able to start a transaction with meterStart greater than 0', async () => {
          await testData.ocppCommonTests.testStartTransactionWithMeterStartGreaterZero();
        });

        it('Should not be able to start a transaction with invalid tag', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidTag();
        });

        it('Should not be able to start a transaction with invalid connectorId', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidConnectorId();
        });

        it('Should not be able to start a transaction with invalid meterStart', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidMeterStart();
        });

        it('Should be able to stop a transaction without transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithoutTransactionData();
        });

        it('Should be able to stop a transaction with transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithTransactionData();
        });

        it('Should not be able to stop a transaction with invalid transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithInvalidTransactionData();
        });

        it('Should be able to retrieve the last reboot date', async () => {
          await testData.ocppCommonTests.testRetrieveLastRebootDate();
        });

        it('Should be able to perform a transaction, where Keba clock meterValues are ignored', async () => {
          await testData.ocppCommonTests.testTransactionIgnoringClockMeterValues();
        });

        it('Charging station should set both of its connectors to Available', async () => {
          await testData.ocppCommonTests.testConnectorStatus();
        });

        it('Charging station should send its heartbeat', async () => {
          await testData.ocppCommonTests.testHeartbeat();
        });

        it('Charging station can change its connector status to Occupied', async () => {
          await testData.ocppCommonTests.testChangeConnectorStatus();
        });

        it('Charging station should send data transfer', async () => {
          await testData.ocppCommonTests.testDataTransfer();
        });

      });

      describe('Where basic user as start and stop user', () => {

        before(() => {
          testData.ocppCommonTests.setUsers(
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER)
          );
        });

        describe('Users should be able to perform a complete regular transaction cycle', () => {

          after(async () => {
            await testData.chargingStationContext.cleanUpCreatedData();
          });

          it('Start user should be able to start a new transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

          it('Start user should be able to start a second time a new transaction', async () => {
            await testData.ocppCommonTests.testStartSecondTransaction();
          });

          it('Charging station should send meter values', async () => {
            await testData.ocppCommonTests.testSendMeterValues();
          });

          it('Stop user should be able to stop the transaction', async () => {
            await testData.ocppCommonTests.testStopTransaction();
          });

          it('Transaction must have the right consumption metrics, pricing and inactivity', async () => {
            await testData.ocppCommonTests.testTransactionMetrics();
          });

          it('Start user should not be able to delete his transaction', async () => {
            await testData.ocppCommonTests.testDeleteTransaction(true);
          });

          it('Start user should be able to start a new transaction which can be stopped by StatusNotification', async () => {
            await testData.ocppCommonTests.testConnectorStatusToStopTransaction();
          });

        });

      });

      describe('Where basic user as start user and admin user as stop user', () => {

        before(() => {
          testData.ocppCommonTests.setUsers(
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER),
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN)
          );
        });

        describe('Users should be able to perform a complete regular transaction cycle', () => {

          after(async () => {
            await testData.chargingStationContext.cleanUpCreatedData();
          });

          it('Start user should be able to start a new transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

          it('Start user should be able to start a second time a new transaction', async () => {
            await testData.ocppCommonTests.testStartSecondTransaction();
          });

          it('Charging station should send meter values', async () => {
            await testData.ocppCommonTests.testSendMeterValues();
          });

          it('Stop user should be able to stop the transaction', async () => {
            await testData.ocppCommonTests.testStopTransaction();
          });

          it('Transaction must have the right consumption metrics, pricing and inactivity', async () => {
            await testData.ocppCommonTests.testTransactionMetrics();
          });

          it('Start user should not be able to delete his transaction', async () => {
            await testData.ocppCommonTests.testDeleteTransaction(true);
          });

          it('Start user should be able to start a new transaction which can be stopped by StatusNotification', async () => {
            await testData.ocppCommonTests.testConnectorStatusToStopTransaction();
          });

        });

      });

    });

    describe('For OCPP Version 1.6 (JSON)', () => {

      before(() => {
        testData.chargingStationContext = testData.siteAreaContext.getChargingStationContext(CONTEXTS.CHARGING_STATION_CONTEXTS.ASSIGNED_OCPP16);
        testData.ocppCommonTests.setChargingStation(testData.chargingStationContext);
      });

      after(async () => {
        await testData.chargingStationContext.cleanUpCreatedData();
      });

      describe('Where any user', () => {

        it('With tag as integer should be authorized to start a transaction', async () => {
          await testData.ocppCommonTests.testAuthorizeTagAsInteger();
        });

        it('With invalid tag should not be authorized to start a transaction', async () => {
          await testData.ocppCommonTests.testAuthorizeInvalidTag();
        });

        it('Should be able to start transaction with tag as integer', async () => {
          await testData.ocppCommonTests.testStartTransactionWithTagAsInteger();
        });

        it('Should be able to start a transaction with connectorId as string', async () => {
          await testData.ocppCommonTests.testStartTransactionWithConnectorIdAsString();
        });

        it('Should be able to start a transaction with meterStart as string', async () => {
          await testData.ocppCommonTests.testStartTransactionWithMeterStartAsString();
        });

        it('Should be able to start a transaction with meterStart greater than 0', async () => {
          await testData.ocppCommonTests.testStartTransactionWithMeterStartGreaterZero();
        });

        it('Should not be able to start a transaction with invalid tag', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidTag();
        });

        it('Should not be able to start a transaction with invalid connectorId', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidConnectorId();
        });

        it('Should not be able to start a transaction with invalid meterStart', async () => {
          await testData.ocppCommonTests.testStartTransactionWithInvalidMeterStart();
        });

        it('Should be able to stop a transaction without transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithoutTransactionData();
        });

        it('Should be able to stop a transaction with transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithTransactionData();
        });

        it('Should not be able to stop a transaction with invalid transactionData', async () => {
          await testData.ocppCommonTests.testStopTransactionWithInvalidTransactionData();
        });

        it('Should be able to retrieve the last reboot date', async () => {
          await testData.ocppCommonTests.testRetrieveLastRebootDate();
        });

        it('Should be able to perform a transaction, where Keba clock meterValues are ignored', async () => {
          await testData.ocppCommonTests.testTransactionIgnoringClockMeterValues();
        });

        it('Charging station should set both of its connectors to Available', async () => {
          await testData.ocppCommonTests.testConnectorStatus();
        });

        it('Charging station should send its heartbeat', async () => {
          await testData.ocppCommonTests.testHeartbeat();
        });

        it('Charging station can change its connector status to Occupied', async () => {
          await testData.ocppCommonTests.testChangeConnectorStatus();
        });

        it('Charging station should send data transfer', async () => {
          await testData.ocppCommonTests.testDataTransfer();
        });

      });

      describe('Where basic user as start and stop user', () => {

        before(() => {
          testData.ocppCommonTests.setUsers(
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER)
          );
        });

        describe('Users should be able to perform a complete regular transaction cycle', () => {

          after(async () => {
            await testData.chargingStationContext.cleanUpCreatedData();
          });

          it('Start user should be able to start a new transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

          it('Start user should be able to start a second time a new transaction', async () => {
            await testData.ocppCommonTests.testStartSecondTransaction();
          });

          it('Charging station should send meter values', async () => {
            await testData.ocppCommonTests.testSendMeterValues();
          });

          it('Stop user should be able to stop the transaction', async () => {
            await testData.ocppCommonTests.testStopTransaction();
          });

          it('Transaction must have the right consumption metrics, pricing and inactivity', async () => {
            await testData.ocppCommonTests.testTransactionMetrics();
          });

          it('Start user should not be able to delete his transaction', async () => {
            await testData.ocppCommonTests.testDeleteTransaction(true);
          });

        });

        describe('Users should be able to perform a complete transaction cycle with SoC', () => {

          after(async () => {
            await testData.chargingStationContext.cleanUpCreatedData();
          });

          it('Start user should be able to start a new transaction (with SoC)', async () => {
            await testData.ocppCommonTests.testStartTransaction(true);
          });

          it('Charging station should send meter values (with SoC)', async () => {
            await testData.ocppCommonTests.testSendMeterValues(true);
          });

          it('Stop user should be able to stop the transaction (with SoC)', async () => {
            await testData.ocppCommonTests.testStopTransaction(true);
          });

          it('Transaction must have the right consumption metrics, pricing and inactivity (with SoC)', async () => {
            await testData.ocppCommonTests.testTransactionMetrics(true);
          });

          it('Start user should not be able to delete his transaction (with SoC)', async () => {
            await testData.ocppCommonTests.testDeleteTransaction(true);
          });

        });

        describe('Users should be able to perform a complete transaction cycle with SignedData', () => {

          after(async () => {
            await testData.chargingStationContext.cleanUpCreatedData();
          });

          it('Start user should be able to start a new transaction (with SignedData)', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

          it('Charging station should send meter values (with SignedData)', async () => {
            await testData.ocppCommonTests.testSendMeterValues(false, true);
          });

          it('Stop user should be able to stop the transaction (with SignedData)', async () => {
            await testData.ocppCommonTests.testStopTransaction();
          });

          it('Transaction must have the right consumption metrics, pricing and inactivity (with SignedData)', async () => {
            await testData.ocppCommonTests.testTransactionMetrics(false, true);
          });

          it('Start user should not be able to delete his transaction (with SignedData)', async () => {
            await testData.ocppCommonTests.testDeleteTransaction(true);
          });

        });

      });

      describe('Where basic user as start user and admin user as stop user', () => {

        before(() => {
          testData.ocppCommonTests.setUsers(
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.BASIC_USER),
            testData.tenantContext.getUserContext(CONTEXTS.USER_CONTEXTS.DEFAULT_ADMIN)
          );
        });

        describe('Users should be able to perform a complete regular transaction cycle', () => {

          after(async () => {
            await testData.chargingStationContext.cleanUpCreatedData();
          });

          it('Start user should be able to start a new transaction', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

          it('Start user should be able to start a second time a new transaction', async () => {
            await testData.ocppCommonTests.testStartSecondTransaction();
          });

          it('Charging station should send meter values', async () => {
            await testData.ocppCommonTests.testSendMeterValues();
          });

          it('Stop user should be able to stop the transaction', async () => {
            await testData.ocppCommonTests.testStopTransaction();
          });

          it('Transaction must have the right consumption metrics, pricing and inactivity', async () => {
            await testData.ocppCommonTests.testTransactionMetrics();
          });

          it('Start user should not be able to delete his transaction', async () => {
            await testData.ocppCommonTests.testDeleteTransaction(true);
          });

        });

        describe('Users should be able to perform a complete transaction cycle with SoC', () => {

          after(async () => {
            await testData.chargingStationContext.cleanUpCreatedData();
          });

          it('Start user should be able to start a new transaction (with SoC)', async () => {
            await testData.ocppCommonTests.testStartTransaction(true);
          });

          it('Charging station should send meter values (with SoC)', async () => {
            await testData.ocppCommonTests.testSendMeterValues(true);
          });

          it('Stop user should be able to stop the transaction (with SoC)', async () => {
            await testData.ocppCommonTests.testStopTransaction(true);
          });

          it('Transaction must have the right consumption metrics, pricing and inactivity (with SoC)', async () => {
            await testData.ocppCommonTests.testTransactionMetrics(true);
          });

          it('Start user should not be able to delete his transaction (with SoC)', async () => {
            await testData.ocppCommonTests.testDeleteTransaction(true);
          });

        });

        describe('Users should be able to perform a complete transaction cycle with SignedData', () => {

          after(async () => {
            await testData.chargingStationContext.cleanUpCreatedData();
          });

          it('Start user should be able to start a new transaction (with SignedData)', async () => {
            await testData.ocppCommonTests.testStartTransaction();
          });

          it('Charging station should send meter values (with SignedData)', async () => {
            await testData.ocppCommonTests.testSendMeterValues(false, true);
          });

          it('Stop user should be able to stop the transaction (with SignedData)', async () => {
            await testData.ocppCommonTests.testStopTransaction();
          });

          it('Transaction must have the right consumption metrics, pricing and inactivity (with SignedData)', async () => {
            await testData.ocppCommonTests.testTransactionMetrics(false, true);
          });

          it('Start user should not be able to delete his transaction (with SignedData)', async () => {
            await testData.ocppCommonTests.testDeleteTransaction(true);
          });

        });

      });

    });

  });

});
