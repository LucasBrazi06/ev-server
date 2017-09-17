const Configuration = require('./Configuration');
const Logging = require('./Logging');
require('source-map-support').install();

let _centralSystemFrontEndConfig = Configuration.getCentralSystemFrontEndConfig();

module.exports = {
  generateID() {
    return new Date().getTime();
  },

  buildUserFullName(user, withID=true) {
    if (!user) {
      return "Unknown";
    }
    // First name?
    if (!user.firstName) {
      return user.name;
    }
    // Set the ID?
    if (withID) {
      return `${user.firstName} ${user.name} (${user.id})`;
    } else {
      return `${user.firstName} ${user.name}`;
    }
  },

  // Save the users in file
  saveFile(filename, content) {
    // Save
    fs.writeFileSync(path.join(__dirname, filename), content, 'UTF-8');
  },

  getRandomInt() {
    return Math.floor((Math.random() * 1000000000) + 1);
  },

  buildEvseURL() {
    return _centralSystemFrontEndConfig.protocol + "://" +
      _centralSystemFrontEndConfig.host + ":" +
      _centralSystemFrontEndConfig.port;
  },

  getDefaultLocale() {
    return "en_US";
  },

  buildEvseUserURL(user) {
    let _evseBaseURL = this.buildEvseURL();
    // Add : https://localhost:8080/#/pages/chargers/charger/REE001
    return _evseBaseURL + "/#/pages/users/user/" + user.getID();
  },

  buildEvseChargingStationURL(chargingStation, connectorId) {
    let _evseBaseURL = this.buildEvseURL();
    // Add : https://localhost:8080/#/pages/chargers/charger/REE001
    return _evseBaseURL + "/#/pages/chargers/charger/" + chargingStation.getChargeBoxIdentity() +
    "/connector/" + connectorId;
  },

  buildEvseTransactionURL(chargingStation, connectorId, transactionId) {
    let _evseBaseURL = this.buildEvseURL();
    // Add : https://localhost:8080/#/pages/chargers/charger/REE001
    return _evseBaseURL + "/#/pages/chargers/charger/" + chargingStation.getChargeBoxIdentity() +
    "/connector/" + connectorId + "/transaction/" + transactionId;
  },
};
