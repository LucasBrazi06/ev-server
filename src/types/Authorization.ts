export enum Entity {
  SITE = 'Site',
  SITES = 'Sites',
  SITE_AREA = 'SiteArea',
  SITE_AREAS = 'SiteAreas',
  COMPANY = 'Company',
  COMPANIES = 'Companies',
  CHARGING_STATION = 'ChargingStation',
  CHARGING_STATIONS = 'ChargingStations',
  TENANT = 'Tenant',
  TENANTS = 'Tenants',
  TRANSACTION = 'Transaction',
  TRANSACTIONS = 'Transactions',
  TRANSACTION_METER_VALUES = 'MeterValues',
  TRANSACTION_STOP = 'Stop',
  REPORT = 'Report',
  USER = 'User',
  USERS = 'Users',
  VEHICLE_MANUFACTURER = 'VehicleManufacturer',
  VEHICLE_MANUFACTURERS = 'VehicleManufacturers',
  VEHICLES = 'Vehicles',
  VEHICLE = 'Vehicle',
  LOGGINGS = 'Loggings',
  LOGGING = 'Logging',
  PRICING = 'Pricing',
  BILLING = 'Billing',
  SETTING = 'Setting',
  SETTINGS = 'Settings',
  TOKENS = 'Tokens',
  TOKEN = 'Token',
  OCPI_ENDPOINT = 'OcpiEndpoint',
  OCPI_ENDPOINTS = 'OcpiEndpoints',
  CONNECTION = 'Connection',
  CONNECTIONS = 'Connections',
}

export enum Role {
  SUPER_ADMIN = 'S',
  ADMIN = 'A',
  BASIC = 'B',
  DEMO = 'D',
}

export enum Action {
  READ = 'Read',
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  LOGOUT = 'Logout',
  LOGIN = 'Login',
  LIST = 'List',
  RESET = 'Reset',
  AUTHORIZE = 'Authorize',
  CLEAR_CACHE = 'ClearCache',
  DATA_TRANSFER = 'DataTransfer',
  STOP_TRANSACTION = 'StopTransaction',
  REMOTE_STOP_TRANSACTION = 'RemoteStopTransaction',
  START_TRANSACTION = 'StartTransaction',
  REMOTE_START_TRANSACTION = 'RemoteStartTransaction',
  REFUND_TRANSACTION = 'RefundTransaction',
  UNLOCK_CONNECTOR = 'UnlockConnector',
  GET_CONFIGURATION = 'GetConfiguration',
  GET_CHARGING_PROFILE = 'GetChargingProfile',
  PING = 'Ping',
  TRIGGER_JOB = 'TriggerJob',
  REGISTER = 'Register',
  REGISTER_USER = 'RegisterUser',
  GENERATE_LOCAL_TOKEN = 'GenerateLocalToken',
  CHECK_CONNECTION_BILLING = 'CheckBillingConnection',
  SYNCHRONIZE_BILLING = 'SynchronizeUsersBilling',
  BILLING_TRANSACTION = 'BillingTransaction',
  READ_BILLING_TAXES = 'ReadBillingTaxes',
  POWER_LIMITATION = 'PowerLimitation',
  SET_CHARGING_PROFILE = 'SetChargingProfile',
  EXPORT_PARAMS = 'ExportParams',
  RESEND_VERIFICATION_MAIL = 'ResendVerificationEmail',
  END_USER_LICENSE_AGREEMENT = 'EndUserLicenseAgreement',
  CHECK_END_USER_LICENSE_AGREEMENT = 'CheckEndUserLicenseAgreement',
  VERIFY_EMAIL = 'VerifyEmail',
  FIRMWARE_DOWNLOAD = 'FirmwareDownload',

  UPDATE_CHARGING_STATION_TEMPLATE_MASK = 'UpdateChargingStationTemplatesTask',
  CHECK_OFFLINE_CHARGING_STATION_TASK = 'CheckOfflineChargingStationsTask',
  CHECK_PREPARING_SESSION_NOT_STARTED_TASK = 'CheckPreparingSessionNotStartedTask',
  CHECK_USER_ACCOUNT_INACTIVITY_TASK = 'CheckUserAccountInactivityTask',
  LOGS_CLEAN_UP = 'LogsCleanUp',
  REFUND_SYNCHRONIZE = 'RefundSynchronize',
  OCPI_GET_CDRS = 'OCPIGetCdrs',
  OCPI_GET_LOCATIONS = 'OCPIiGetLocations',
  OCPI_GET_SESSIONS_TASK = 'OCPIGetSessionsTask',
  OCPI_PATCH_LOCATIONS = 'OCPIPatchLocations',

  BOOT_NOTIFICATION = 'BootNotification',

  REQUEST_CONFIGURATION = 'RequestConfiguration',
  UPDATE_CHARGING_STATION_TEMPLATES_FROM_FILE = 'UpdateChargingStationTemplatesFromFile',

  CHARGING_STATION_STATUS_ERROR = 'NotifyChargingStationStatusError',
  CHARGING_STATION_REGISTERED = 'NotifyChargingStationRegistered',
  END_OF_CHARGE = 'NotifyEndOfCharge',
  OPTIMAL_CHARGE_REACHED = 'NotifyOptimalChargeReached',
  END_OF_SESSION = 'NotifyEndOfSession',
  REQUEST_PASSWORD = 'NotifyRequestPassword',
  USER_ACCOUNT_STATUS_CHANGED = 'NotifyUserAccountStatusChanged',
  NEW_REGISTERED_USER = 'NotifyNewRegisteredUser',
  UNKNOWN_USER_BADGED = 'NotifyUnknownUserBadged',
  TRANSACTION_STARTED = 'NotifyTransactionStarted',
  VERIFICATION_EMAIL = 'NotifyVerificationEmail',
  AUTH_EMAIL_ERROR = 'NotifyAuthentificationErrorEmailServer',
  PATCH_EVSE_STATUS_ERROR = 'NotifyPatchEVSEStatusError',
  USER_ACCOUNT_INACTIVITY = 'NotifyUserAccountInactivity',
  PREPARING_SESSION_NOT_STARTED = 'NotifyPreparingSessionNotStarted',
  OFFLINE_CHARGING_STATIONS = 'NotifyOfflineChargingStations',
  BILLING_USER_SYNCHRONIZATION_FAILED = 'NotifyBillingUserSynchronizationFailed',
  CONNECTORS_ACTION = 'ConnectorsAction',

  HAS_NOTIFICATION = 'HasNotification',

  ADD_CHARGING_STATION_TO_SITE_AREA = 'AddChargingStationsToSiteArea',

  WS_REST_CLIENT_MESSAGE = 'WSRestClientMessage',
  WS_REST_CONNECTION_CLOSED = 'WSRestConnectionClosed',
  WS_CONNECTION = 'WsConnection',

  START_SESSION = 'startSession',
  STOP_SESSION = 'stopSession',
  UPDATE_SESSION = 'updateSession',

  REFUND = 'Refund',

  CHANGE_CONFIGURATION = 'ChangeConfiguration',

  USER_INVOICE = 'UserInvoice',

  BILLING = 'Billing',

  MONGO_DB = 'MongoDB',

  EMPTY_ACTION = '',
  DELETE_CREDENTIALS = 'DELETE credentials',
  OCPI_POST_CREDENTIALS = 'OcpiPostCredentials',


}

