var ChargingStationClient = require('../ChargingStationClient');
var soap = require('strong-soap').soap;
var path = require('path');
var Promise = require('promise');
var Logging = require('../../utils/Logging');

let _client = null;
let _chargingStation;
var _moduleName = "SoapChargingStationClient";

class SoapChargingStationClient extends ChargingStationClient {
  constructor(chargingStation) {
    super();

    _chargingStation = chargingStation;

    // Get the Charging Station
    return new Promise((fulfill, reject) => {
      var chargingStationWdsl = null;

      // Read the WSDL client files
      switch(_chargingStation.getOcppVersion()) {
        // OCPP V1.2
        case "1.2":
          chargingStationWdsl = path.join(__dirname, '/wsdl/OCPP_ChargePointService1.2.wsdl');
          break;
        case "1.5":
          chargingStationWdsl = path.join(__dirname, '/wsdl/OCPP_ChargePointService1.5.wsdl');
          break;
        case "1.6":
          chargingStationWdsl = path.join(__dirname, '/wsdl/OCPP_ChargePointService1.6.wsdl');
          break;
        default:
          // Log
          Logging.logError({
            source: "Central Server", module: "SoapChargingStationClient", method: "constructor",
            message: `OCPP version ${_chargingStation.getOcppVersion()} not supported` });
          reject(`OCPP version ${_chargingStation.getOcppVersion()} not supported`);
      }

      // Client' options
      var options = {};

      // Create client
      soap.createClient(chargingStationWdsl, options, (err, client) => {
        if (err) {
          // Log
          Logging.logError({
            source: tagID, module: "SoapChargingStationClient", method: "constructor",
            message: `Error when creating SOAP client for chaging station with ID ${_chargingStation.getChargeBoxIdentity()}: ${err.toString()}`,
            detailedMessages: err.stack });
          reject(`Error when creating SOAP client for chaging station with ID ${_chargingStation.getChargeBoxIdentity()}: ${err.message}`);
        } else {
          // Keep
          _client = client;
          // // Log
          // _client.on("request", (request) => {
          //   console.log(request);
          // });
          // Set endpoint
          _client.setEndpoint(_chargingStation.getEndPoint());
          // Ok
          fulfill(this);
        }
      });
    });
  }

  initSoapHeaders(action) {
    // Clear the SOAP Headers`
    _client.clearSoapHeaders();

    // Add them
    _client.addSoapHeader(`<h:chargeBoxIdentity xmlns:h="urn://Ocpp/Cp/2012/06/">${_chargingStation.getChargeBoxIdentity()}</h:chargeBoxIdentity>`);
    _client.addSoapHeader(`<a:MessageID xmlns:a="http://www.w3.org/2005/08/addressing">urn:uuid:589e13ae-1787-49f8-ab8b-4567327b23c6</a:MessageID>`);
    _client.addSoapHeader(`<a:ReplyTo xmlns:a="http://www.w3.org/2005/08/addressing"><a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address></a:ReplyTo>`);
    _client.addSoapHeader(`<a:To xmlns:a="http://www.w3.org/2005/08/addressing">${_chargingStation.getEndPoint()}</a:To>`);
    _client.addSoapHeader(`<a:Action xmlns:a="http://www.w3.org/2005/08/addressing">/${action}</a:Action>`);
    _client.addSoapHeader(`<a:From xmlns:a="http://www.w3.org/2005/08/addressing"><a:Address>http://localhost:8080</a:Address></a:From>`);
  }

  reset(args) {
    // Get the Charging Station
    return new Promise((fulfill, reject) => {
      // Init SOAP Headers with the action
      this.initSoapHeaders("Reset");

      // Log
      Logging.logSendAction(_moduleName, _chargingStation.getChargeBoxIdentity(), "Reboot", args);

      // Execute
      _client.Reset({resetRequest: args}, function(err, result, envelope) {
        if(err) {
          // Log
          Logging.logError({
            source: _chargingStation.getChargeBoxIdentity(), module: "SoapChargingStationClient", method: "reset",
            message: `Error when trying to Reboot the station ${_chargingStation.getChargeBoxIdentity()}: ${err.toString()}`,
            detailedMessages: err.stack });
          reject(err);
        } else {
          // Log
          Logging.logReturnedAction(_moduleName, _chargingStation.getChargeBoxIdentity(), "Reboot", result);
          fulfill(result);
        }
      });
    });
  }

  getConfiguration(args) {
    // Get the Charging Station
    return new Promise((fulfill, reject) => {
      // Init SOAP Headers with the action
      this.initSoapHeaders("GetConfiguration");

      // Log
      Logging.logSendAction(_moduleName, _chargingStation.getChargeBoxIdentity(), "GetConfiguration", args);

      // Execute
      _client.GetConfiguration({getConfigurationRequest:(args?args:'')}, (err, result, envelope) => {
        if(err) {
          // Log
          Logging.logError({
            source: _chargingStation.getChargeBoxIdentity(), module: "SoapChargingStationClient", method: "getConfiguration",
            message: `Error when trying to get the Configuration of the station ${_chargingStation.getChargeBoxIdentity()}: ${err.toString()}`,
            detailedMessages: err.stack });
          reject(err);
          //res.json(`{error: ${err.message}}`);
        } else {
          // Log
          Logging.logReturnedAction(_moduleName, _chargingStation.getChargeBoxIdentity(), "getConfiguration", result);
          fulfill(result);
        }
      });
    });
  }

  getChargingStation() {
    return _chargingStation;
  }
}

module.exports = SoapChargingStationClient;
