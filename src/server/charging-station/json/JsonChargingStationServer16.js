const Logging = require('../../../utils/Logging');
const Constants = require('../../../utils/Constants');
const OCPPError = require('../../../exception/OcppError');
const CentralChargingStationService = require('../CentralChargingStationService');

const _moduleName = "JSONServerService";

class JsonChargingStationServer16 extends CentralChargingStationService {

    constructor(wsHandler, chargingStationConfig) {
        super({}, chargingStationConfig);
        this._wsHandler = wsHandler;
    }

    async onCallMessage(messageType, messageId, commandNameOrPayload, commandPayload, errorDetails) {
        try {
            // Check if method exist in central server
            if (typeof this["handle" + commandNameOrPayload] === 'function') {
                let result = await this["handle" + commandNameOrPayload](Object.assign(commandPayload, this._wsHandler._headers));
                // Get answer from central server
                // Response should like { commandNameRespons : { attributes of the response } }
                Logging.logReturnedAction(_moduleName, this._wsHandler.getChargeBoxId(), commandNameOrPayload, {
                    "result": result
                });
                // Check if response contains proper attribute
                let reponseNameProperty = commandNameOrPayload.charAt(0).toLowerCase() + commandNameOrPayload.slice(1) + "Response";
                if (result.hasOwnProperty(reponseNameProperty)) {
                    // Send Response
                    result = await this._wsHandler.sendMessage(messageId, result[reponseNameProperty], Constants.OCPP_JSON_CALLRESULT_MESSAGE);
                } else {
                    // TO DO what shall we do if we did not code it correctly :)
                    // Sacrifice Gerald to the gods ? :)
                }
            } else {
                let error = new OCPPError(Constants.OCPP_ERROR_NOTIMPLEMENTED, "");
                let result = await this._wsHandler.sendError(messageId, error);

                Logging.logError({
                    module: _moduleName,
                    method: "sendMessage",
                    action: "NOT_IMPLEMENTED",
                    message: {
                        message: messageId,
                        error: JSON.stringify(error, null, " ")
                    }
                });
            }
        } catch (err) {
            // send error if payload didn't pass the validation
            let error = new OCPPError(Constants.OCPP_ERROR_FORMATIONVIOLATION, err.message);
            let result = await this._wsHandler.sendError(messageId, error);
            Logging.logError({
                module: _moduleName,
                method: "sendMessage",
                action: "FORMATVIOLATION",
                message: {
                    message: messageId,
                    error: JSON.stringify(error, null, " ")
                }
            });
        }
    }

    getChargeBoxId() {
        return this._wsHandler._headers.chargeBoxIdentity;
    }

    async handleBootNotification(content){
        let bootNotificationResponse = await super.handleBootNotification(content);
        if (!bootNotificationResponse.hasOwnProperty('interval')) {
            bootNotificationResponse.bootNotificationResponse.interval = bootNotificationResponse.bootNotificationResponse.heartbeatInterval;
            delete bootNotificationResponse.bootNotificationResponse.heartbeatInterval;
        }
        return bootNotificationResponse;
    }

    async handleHeartbeat(content) {
        return await super.handleHeartbeat(content);
    }

}

module.exports = JsonChargingStationServer16;