const fs = require('fs');
const soap = require('strong-soap').soap;
const http = require('http');
const https = require('https');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const express = require('express')();
const CFLog = require('cf-nodejs-logging-support');
const CentralSystemServer = require('../CentralSystemServer');
const Logging = require('../../../utils/Logging');
const Constants = require('../../../utils/Constants');
const Configuration = require('../../../utils/Configuration');
const centralSystemService12 = require('./services/SoapCentralSystemService12');
const centralSystemService12Wsdl = require('./wsdl/OCPPCentralSystemService12.wsdl');
const centralSystemService15 = require('./services/SoapCentralSystemService15');
const centralSystemService15Wsdl = require('./wsdl/OCPPCentralSystemService15.wsdl');
const centralSystemService16 = require('./services/SoapCentralSystemService16');
const centralSystemService16Wsdl = require('./wsdl/OCPPCentralSystemService16.wsdl');
const chargePointService12Wsdl = require('../../../client/soap/wsdl/OCPPChargePointService12.wsdl');
const chargePointService15Wsdl = require('../../../client/soap/wsdl/OCPPChargePointService15.wsdl');
const chargePointService16Wsdl = require('../../../client/soap/wsdl/OCPPChargePointService16.wsdl');
const sanitize = require('mongo-sanitize');
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
require('source-map-support').install();

class SoapCentralSystemServer extends CentralSystemServer {
  constructor(centralSystemConfig, chargingStationConfig) {
    // Call parent
    super(centralSystemConfig, chargingStationConfig);
    // Body parser
    express.use(bodyParser.json());
    express.use(bodyParser.urlencoded({
      extended: false
    }));
    express.use(bodyParser.xml());
    // Enable debug?
    if (centralSystemConfig.debug) {
      // Log
      express.use(
        morgan('combined', {
          'stream': {
            write: (message) => {
              // Log
              Logging.logDebug({
                tenantID: Constants.DEFAULT_TENANT,
                module: "CentralSystemServer", method: "constructor",
                action: "HttpRequestLog",
                message: message
              });
            }
          }
        })
      );
    }
    // Cross origin headers
    express.use(cors());
    // Secure the application
    express.use(helmet());
    // Check Cloud Foundry
    if (Configuration.isCloudFoundry()) {
      // Bind to express app
      express.use(CFLog.logNetwork);
    }
    // Default, serve the index.html
    express.get(/^\/wsdl(.+)$/, function (req, res, next) {
      // WDSL file?
      switch (req.params["0"]) {
        // Charge Point WSDL 1.2
        case '/OCPPChargePointService12.wsdl':
          res.send(chargePointService12Wsdl);
          break;
          // Charge Point WSDL 1.5
        case '/OCPPChargePointService15.wsdl':
          res.send(chargePointService15Wsdl);
          break;
          // Charge Point WSDL 1.6
        case '/OCPPChargePointService16.wsdl':
          res.send(chargePointService16Wsdl);
          break;
          // Unknown
        default:
          res.status(500).send(`${sanitize(req.params["0"])} does not exist!`);
      }
    });
  }

  /*
  	Start the server and listen to all SOAP OCCP versions
  	Listen to external command to send request to charging stations
  */
  start() {
    // Create the server
    let server;
    // Log
    console.log(`Starting Soap Central System Server (Charging Stations)...`);
    // Make it global for SOAP Services
    global.centralSystemSoap = this;
    // Create the HTTP server
    if (this._centralSystemConfig.protocol === "https") {
      // Create the options
      let options = {};
      // Set the keys
      options.key = fs.readFileSync(this._centralSystemConfig["ssl-key"]);
      options.cert = fs.readFileSync(this._centralSystemConfig["ssl-cert"]);
      // Intermediate cert?
      if (this._centralSystemConfig["ssl-ca"]) {
        // Array?
        if (Array.isArray(this._centralSystemConfig["ssl-ca"])) {
          options.ca = [];
          // Add all
          for (let i = 0; i < this._centralSystemConfig["ssl-ca"].length; i++) {
            options.ca.push(fs.readFileSync(this._centralSystemConfig["ssl-ca"][i]));
          }
        } else {
          // Add one
          options.ca = fs.readFileSync(_centralSystemRestConfig["ssl-ca"]);
        }
      }
      // Https server
      server = https.createServer(options, express);
    } else {
      // Http server
      server = http.createServer(express);
    }

    // Create Soap Servers
    // OCPP 1.2 -----------------------------------------
    let soapServer12 = soap.listen(server, '/OCPP12', centralSystemService12, centralSystemService12Wsdl);
    // Log
    if (this._centralSystemConfig.debug) {
      // Listen
      soapServer12.log = (type, data) => {
        // Do not log 'Info'
        if (type === 'replied') {
          // Log
          Logging.logDebug({
            tenantID: Constants.DEFAULT_TENANT,
            module: "SoapCentralSystemServer",
            method: "start", action: "SoapRequest",
            message: `OCPP 1.2 - Request Replied`,
            detailedMessages: data
          });
        }
      };
      // Log Request
      soapServer12.on('request', (request, methodName) => {
        // Log
        Logging.logDebug({
          tenantID: Constants.DEFAULT_TENANT,
          module: "SoapCentralSystemServer",
          method: "start", action: "SoapRequest",
          message: `OCPP 1.2 - Request '${methodName}' Received`,
          detailedMessages: request
        });
      });
    }
    // OCPP 1.5 -----------------------------------------
    let soapServer15 = soap.listen(server, '/OCPP15', centralSystemService15, centralSystemService15Wsdl);
    // Log
    if (this._centralSystemConfig.debug) {
      // Listen
      soapServer15.log = (type, data) => {
        // Do not log 'Info'
        if (type === 'replied') {
          // Log
          Logging.logDebug({
            tenantID: Constants.DEFAULT_TENANT,
            module: "SoapCentralSystemServer",
            method: "start", action: "SoapRequest",
            message: `OCPP 1.5 - Request Replied`,
            detailedMessages: data
          });
        }
      };
      // Log Request
      soapServer15.on('request', (request, methodName) => {
        // Log
        Logging.logDebug({
          tenantID: Constants.DEFAULT_TENANT,
          module: "SoapCentralSystemServer",
          method: "start", action: "SoapRequest",
          message: `OCPP 1.5 - Request '${methodName}' Received`,
          detailedMessages: request
        });
      });
    }
    // OCPP 1.6 -----------------------------------------
    let soapServer16 = soap.listen(server, '/OCPP16', centralSystemService16, centralSystemService16Wsdl);
    // Log
    if (this._centralSystemConfig.debug) {
      // Listen
      soapServer16.log = (type, data) => {
        // Do not log 'Info'
        if (type === 'replied') {
          // Log
          Logging.logDebug({
            tenantID: Constants.DEFAULT_TENANT,
            module: "SoapCentralSystemServer",
            method: "start", action: "SoapRequest",
            message: `OCPP 1.6 - Request Replied`,
            detailedMessages: data
          });
        }
      };
      // Log Request
      soapServer16.on('request', (request, methodName) => {
        // Log
        Logging.logDebug({
          tenantID: Constants.DEFAULT_TENANT,
          module: "SoapCentralSystemServer", method: "start",
          action: "SoapRequest",
          message: `OCPP 1.6 - Request '${methodName}' Received`,
          detailedMessages: request
        });
      });
    }

    // Listen
    server.listen(this._centralSystemConfig.port, this._centralSystemConfig.host, () => {
      // Log
      Logging.logInfo({
        tenantID: Constants.DEFAULT_TENANT,
        module: "SoapCentralSystemServer", method: "start",
        action: "Startup",
        message: `Soap Central System Server (Charging Stations) listening on '${this._centralSystemConfig.protocol}://${server.address().address}:${server.address().port}'`
      });
      console.log(`Soap Central System Server (Charging Stations) listening on '${this._centralSystemConfig.protocol}://${server.address().address}:${server.address().port}'`);
    });
  }
}

module.exports = SoapCentralSystemServer;