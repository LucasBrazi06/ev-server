import * as admin from 'firebase-admin';
import i18n from 'i18n-js';
import Tenant from '../../types/Tenant';
import User from '../../types/User';
import { ChargingStationRegisteredNotification, ChargingStationStatusErrorNotification, EndOfChargeNotification, EndOfSessionNotification, EndOfSignedSessionNotification, NewRegisteredUserNotification, NotificationSeverity, OCPIPatchChargingStationsStatusesErrorNotification, OfflineChargingStationNotification, OptimalChargeReachedNotification, PreparingSessionNotStartedNotification, RequestPasswordNotification, SmtpAuthErrorNotification, TransactionStartedNotification, UnknownUserBadgedNotification, UserAccountInactivityNotification, UserAccountStatusChangedNotification, UserNotificationType, VerificationEmailNotification } from '../../types/UserNotifications';
import Configuration from '../../utils/Configuration';
import Constants from '../../utils/Constants';
import I18nManager from '../../utils/I18nManager';
import Logging from '../../utils/Logging';
import Utils from '../../utils/Utils';
import NotificationTask from '../NotificationTask';

export default class RemotePushNotificationTask implements NotificationTask {
  private firebaseConfig = Configuration.getFirebaseConfig();
  private initialized = false;

  constructor() {
    // Init
    if (this.firebaseConfig && this.firebaseConfig.type && this.firebaseConfig.type.length > 0) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: this.firebaseConfig.projectID,
            clientEmail: this.firebaseConfig.clientEmail,
            privateKey: this.firebaseConfig.privateKey
          }),
          databaseURL: this.firebaseConfig.databaseURL
        });
        // Ok
        this.initialized = true;
      } catch (error) {
        Logging.logError({
          tenantID: Constants.DEFAULT_TENANT,
          module: 'RemotePushNotificationTask', method: 'constructor',
          message: `Error initializing Firebase: '${error.message}'`,
          action: 'RemotePushNotification',
          detailedMessages: error
        });
      }
    }
  }

  public sendUserAccountInactivity(data: UserAccountInactivityNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.userAccountInactivity.title') + ' - ' + tenant.name;
    const body = i18n.t('notifications.userAccountInactivity.body',
      { lastLogin: data.lastLogin });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.USER_ACCOUNT_INACTIVITY, title, body, user, {
        lastLogin: data.lastLogin
      },
      severity
    );
  }

  public sendPreparingSessionNotStarted(data: PreparingSessionNotStartedNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.preparingSessionNotStarted.title') + ' - ' + tenant.name;
    const body = i18n.t('notifications.preparingSessionNotStarted.body', { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.PREPARING_SESSION_NOT_STARTED, title, body, user, {
        chargeBoxID: data.chargeBoxID,
        connectorId: data.connectorId
      },
      severity
    );
  }

  public sendOfflineChargingStations(data: OfflineChargingStationNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void>  {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.offlineChargingStation.title') + ' - ' + tenant.name;
    const body = i18n.t('notifications.offlineChargingStation.body');
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.OFFLINE_CHARGING_STATION, title, body, user, null, severity);
  }

  public sendNewRegisteredUser(data: NewRegisteredUserNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Nothing to send
    return Promise.resolve();
  }

  public sendRequestPassword(data: RequestPasswordNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Nothing to send
    return Promise.resolve();
  }

  public sendOptimalChargeReached(data: OptimalChargeReachedNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.optimalChargeReached.title',
      { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId }) + ' - ' + tenant.name;
    const body = i18n.t('notifications.optimalChargeReached.body',
      { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.OPTIMAL_CHARGE_REACHED, title, body, user, {
        transactionId: data.transactionId + '',
        chargeBoxID: data.chargeBoxID,
        connectorId: data.connectorId + ''
      },
      severity
    );
  }

  public sendEndOfCharge(data: EndOfChargeNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.endOfCharge.title',
      { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId }) + ' - ' + tenant.name;
    const body = i18n.t('notifications.endOfCharge.body',
      { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.END_OF_CHARGE, title, body, user, {
        transactionId: data.transactionId + '',
        chargeBoxID: data.chargeBoxID,
        connectorId: data.connectorId + ''
      },
      severity
    );
  }

  public sendEndOfSession(data: EndOfSessionNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.endOfSession.title',
      { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId }) + ' - ' + tenant.name;
    const body = i18n.t('notifications.endOfSession.body',
      { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.END_OF_SESSION, title, body, user, {
        transactionId: data.transactionId + '',
        chargeBoxID: data.chargeBoxID,
        connectorId: data.connectorId + ''
      },
      severity
    );
  }

  public sendEndOfSignedSession(data: EndOfSignedSessionNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Nothing to send
    return Promise.resolve();
  }

  public sendChargingStationStatusError(data: ChargingStationStatusErrorNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.chargingStationStatusError.title',
      { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId, error: data.error }) + ' - ' + tenant.name;
    const body = i18n.t('notifications.chargingStationStatusError.body',
      { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId, error: data.error });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.CHARGING_STATION_STATUS_ERROR, title, body, user, {
        chargeBoxID: data.chargeBoxID,
        connectorId: data.connectorId + ''
      },
      severity
    );
  }

  public sendChargingStationRegistered(data: ChargingStationRegisteredNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.chargingStationRegistered.title', { chargeBoxID: data.chargeBoxID }) + ' - ' + tenant.name;
    const body = i18n.t('notifications.chargingStationRegistered.body', { chargeBoxID: data.chargeBoxID });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.CHARGING_STATION_REGISTERED, title, body, user, {
        chargeBoxID: data.chargeBoxID
      },
      severity
    );
  }

  public sendUserAccountStatusChanged(data: UserAccountStatusChangedNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    const status = user.status === Constants.USER_STATUS_ACTIVE ?
      i18n.t('notifications.userAccountStatusChanged.activated') :
      i18n.t('notifications.userAccountStatusChanged.suspended');
    // Get Message Text
    const title = i18n.t('notifications.userAccountStatusChanged.title', { status: Utils.firstLetterInUpperCase(status) }) + ' - ' + tenant.name;
    const body = i18n.t('notifications.userAccountStatusChanged.body', { status });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.USER_ACCOUNT_STATUS_CHANGED, title, body, user, {
        userID: user.id
      },
      severity
    );
  }

  public sendUnknownUserBadged(data: UnknownUserBadgedNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.unknownUserBadged.title') + ' - ' + tenant.name;
    const body = i18n.t('notifications.unknownUserBadged.body', { chargeBoxID: data.chargeBoxID, badgeID: data.badgeID });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.UNKNOWN_USER_BADGED, title, body, user, {
        chargeBoxID: data.chargeBoxID,
        badgeID: data.badgeID
      },
      severity
    );
  }

  public sendSessionStarted(data: TransactionStartedNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.sessionStarted.title') + ' - ' + tenant.name;
    const body = i18n.t('notifications.sessionStarted.body', { chargeBoxID: data.chargeBoxID, connectorId: data.connectorId });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.SESSION_STARTED, title, body, user, {
        'transactionId': data.transactionId + '',
        'chargeBoxID': data.chargeBoxID,
        'connectorId': data.connectorId + ''
      },
      severity
    );
  }

  public sendVerificationEmail(data: VerificationEmailNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Nothing to send
    return Promise.resolve();
  }

  public sendSmtpAuthError(data: SmtpAuthErrorNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.smtpAuthError.title') + ' - ' + tenant.name;
    const body = i18n.t('notifications.smtpAuthError.body');
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.SMTP_AUTH_ERROR, title, body, user, null, severity);
  }

  public sendOCPIPatchChargingStationsStatusesError(data: OCPIPatchChargingStationsStatusesErrorNotification, user: User, tenant: Tenant, severity: NotificationSeverity): Promise<void> {
    // Set the locale
    I18nManager.switchLocale(user.locale);
    // Get Message Text
    const title = i18n.t('notifications.ocpiPatchChargingStationsStatusesError.title') + ' - ' + tenant.name;
    const body = i18n.t('notifications.ocpiPatchChargingStationsStatusesError.body', { location: data.location });
    // Send Notification
    return this.sendRemotePushNotificationToUser(tenant, UserNotificationType.OCPI_PATCH_STATUS_ERROR, title, body, user, null, severity);
  }

  private sendRemotePushNotificationToUser(tenant: Tenant, notificationType: UserNotificationType, title: string, body: string, user: User, data?: object, severity?: NotificationSeverity) {
    // Checks
    if (!this.initialized) {
      return Promise.resolve();
    }
    if (!user || !user.mobileToken || user.mobileToken.length === 0) {
      Logging.logWarning({
        tenantID: tenant,
        source: (data && data.hasOwnProperty('chargeBoxID') ? data['chargeBoxID'] : null),
        module: 'RemotePushNotificationTask', method: 'sendRemotePushNotificationToUsers',
        message: `'${notificationType}': No mobile token found for this User`,
        actionOnUser: user.id,
        action: 'RemotePushNotification',
        detailedMessages: [title, body]
      });
      // Send nothing
      return Promise.resolve();
    }
    // Create message
    const message = this.createMessage(tenant, notificationType, title, body, data, severity);
    // Send message
    admin.messaging().sendToDevice(
        user.mobileToken,
        message,
        { priority: 'high', timeToLive: 60*60*24 }
      ).then((response) => {
      // Response is a message ID string.
      Logging.logInfo({
        tenantID: tenant,
        source: (data && data.hasOwnProperty('chargeBoxID') ? data['chargeBoxID'] : null),
        module: 'RemotePushNotificationTask', method: 'sendRemotePushNotificationToUsers',
        message: `Notification Sent: '${notificationType}' - '${title}'`,
        actionOnUser: user.id,
        action: 'RemotePushNotification',
        detailedMessages: [title, body, data, response]
      });
    }).catch((error) => {
      Logging.logError({
        tenantID: tenant,
        source: (data && data.hasOwnProperty('chargeBoxID') ? data['chargeBoxID'] : null),
        module: 'RemotePushNotificationTask', method: 'sendRemotePushNotificationToUsers',
        message: `Error when sending Notification: '${notificationType}' - '${error.message}'`,
        actionOnUser: user.id,
        action: 'RemotePushNotification',
        detailedMessages: error
      });
    });
  }

  private createMessage(tenant: Tenant, notificationType: UserNotificationType, title: string, body: string, data: object, severity: NotificationSeverity): admin.messaging.MessagingPayload {
    // Build message
    const message: admin.messaging.MessagingPayload = {
      notification: {
        title,
        body,
        icon: '@drawable/ic_stat_ic_notification',
        sound: 'default',
        badge: '0',
        color: severity ? severity : NotificationSeverity.INFO,
        channelId: 'e-Mobility'
      }
    };
    // Extra data
    message.data = { tenantID: tenant.id, notificationType, ...data };
    return message;
  }
}
