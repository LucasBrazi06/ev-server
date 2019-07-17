import AuthService from './service/AuthService';
import Logging from '../../utils/Logging';
import UtilsService from './service/UtilsService';
import { constants } from 'http2';
import Constants from '../../utils/Constants';

export default {
  // Init Passport
  initialize() {
    return AuthService.initialize();
  },

  authenticate() {
    return AuthService.authenticate();
  },

  async authService(req, res, next) {
    // Parse the action
    const action = /^\/\w*/g.exec(req.url)[0].substring(1);
    // Get the tenant
    let tenant = Constants.DEFAULT_TENANT;
    if (req.body && req.body.tenant) {
      tenant = req.body.tenant;
    } else if (req.query && req.query.tenant) {
      tenant = req.query.tenant;
    } else if (req.user && req.user.tenantID) {
      tenant = req.user.tenantID;
    }
    try {
      // Check Context
      switch (req.method) {
        // Create Request
        case 'POST':
          // Action
          switch (action) {
            // Login
            case 'Login':
              // Delegate
              await AuthService.handleLogIn(action, req, res, next);
              break;

            // Register User
            case 'RegisterUser':
              // Delegate
              await AuthService.handleRegisterUser(action, req, res, next);
              break;

            // Reset password
            case 'Reset':
              // Delegate
              await AuthService.handleUserPasswordReset(action, req, res, next);
              break;

            // Resend verification email
            case 'ResendVerificationEmail':
              // Delegate
              await AuthService.handleResendVerificationEmail(action, req, res, next);
              break;

            default:
              // Delegate
              UtilsService.handleUnknownAction(action, req, res, next);
          }
          break;

        // Get Request
        case 'GET':
          // Action
          switch (action) {
            // Log out
            case 'Logout':
              // Delegate
              AuthService.handleUserLogOut(action, req, res, next);
              break;

            // End-user license agreement
            case 'EndUserLicenseAgreement':
              // Delegate
              await AuthService.handleGetEndUserLicenseAgreement(action, req, res, next);
              break;

            // Verify Email
            case 'VerifyEmail':
              // Delegate
              await AuthService.handleVerifyEmail(action, req, res, next);
              break;

            default:
              // Delegate
              UtilsService.handleUnknownAction(action, req, res, next);
          }
          break;
      }
    } catch (error) {
      Logging.logActionExceptionMessageAndSendResponse(action, error, req, res, next, tenant);
    }
  }
};
