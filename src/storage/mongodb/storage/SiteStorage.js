const Constants = require('../../../utils/Constants');
const Database = require('../../../utils/Database');
const Utils = require('../../../utils/Utils');
const Company = require('../../../model/Company');
const ChargingStation = require('../../../model/ChargingStation');
const Site = require('../../../model/Site');
const SiteArea = require('../../../model/SiteArea');
const SiteAreaStorage = require('./SiteAreaStorage');
const User = require('../../../model/User');
const AppError = require('../../../exception/AppError');
const ObjectID = require('mongodb').ObjectID;

let _db;

class SiteStorage {
	static setDatabase(db) {
		_db = db;
	}

	static async handleGetSite(id, withCompany, withUsers) {
		// Create Aggregation
		let aggregation = [];
		// Filters
		aggregation.push({
			$match: { _id: Utils.convertToObjectID(id) }
		});
		// Add Created By / Last Changed By
		Utils.pushCreatedLastChangedInAggregation(aggregation);
		// User
		if (withUsers) {
			// Add
			aggregation.push({
				$lookup: {
					from: "siteusers",
					localField: "_id",
					foreignField: "siteID",
					as: "siteusers"
				}
			});
			// Add
			aggregation.push({
				$lookup: {
					from: "users",
					localField: "siteusers.userID",
					foreignField: "_id",
					as: "users"
				}
			});
		}
		// Add SiteAreas
		aggregation.push({
			$lookup: {
				from: "siteareas",
				localField: "_id",
				foreignField: "siteID",
				as: "siteAreas"
			}
		});
		if (withCompany) {
			// Add Company
			aggregation.push({
				$lookup: {
					from: "companies",
					localField: "companyID",
					foreignField: "_id",
					as: "company"
				}
			});
			// Single Record
			aggregation.push({
				$unwind: { "path": "$company", "preserveNullAndEmptyArrays": true }
			});
		}
		// Read DB
		let sitesMDB = await _db.collection('sites')
			.aggregate(aggregation)
			.toArray();
		let site = null;
		// Create
		if (sitesMDB && sitesMDB.length > 0) {
			// Create
			site = new Site(sitesMDB[0]);
			// Set Site Areas
			site.setSiteAreas(sitesMDB[0].siteAreas.map((siteArea) => {
				return new SiteArea(siteArea);
			}));
			// Set Company
			if (withCompany) {
				site.setCompany(new Company(sitesMDB[0].company));
			}
			// Set users
			if (withUsers && sitesMDB[0].users) {
				// Create Users
				sitesMDB[0].users = sitesMDB[0].users.map((user) => {
					return new User(user);
				});
				site.setUsers(sitesMDB[0].users)
			}
		}
		return site;
	}

	static async handleGetSiteImage(id) {
		// Read DB
		let siteImagesMDB = await _db.collection('siteimages')
			.find({_id: Utils.convertToObjectID(id)})
			.limit(1)
			.toArray();
		let siteImage = null;
		// Set
		if (siteImagesMDB && siteImagesMDB.length > 0) {
			siteImage = {
				id: siteImagesMDB[0]._id,
				image: siteImagesMDB[0].image
			};
		}
		return siteImage;
	}

	static async handleGetSiteImages() {
		// Read DB
		let siteImagesMDB = await _db.collection('siteimages')
			.find({})
			.toArray();
		let siteImages = [];
		// Set
		if (siteImagesMDB && siteImagesMDB.length > 0) {
			// Add
			siteImagesMDB.forEach((siteImageMDB) => {
				siteImages.push({
					id: siteImageMDB._id,
					image: siteImageMDB.image
				});
			});
		}
		return siteImages;
	}

	static async handleSaveSite(siteToSave) {
		// Check if ID/Name is provided
		if (!siteToSave.id && !siteToSave.name) {
			// ID must be provided!
			throw new AppError(
				Constants.CENTRAL_SERVER,
				`Site has no ID and no Name`,
				550, "SiteStorage", "handleSaveSite");
		}
		let siteFilter = {};
		// Build Request
		if (siteToSave.id) {
			siteFilter._id = Utils.convertUserToObjectID(siteToSave.id);
		} else {
			siteFilter._id = new ObjectID();
		}
		// Check Created By/On
		siteToSave.createdBy = Utils.convertUserToObjectID(siteToSave.createdBy);
		siteToSave.lastChangedBy = Utils.convertUserToObjectID(siteToSave.lastChangedBy);
		// Transfer
		let site = {};
		Database.updateSite(siteToSave, site, false);
		// Modify
	    let result = await _db.collection('sites').findOneAndUpdate(
			siteFilter,
			{$set: site},
			{upsert: true, new: true, returnOriginal: false});
		// Create
		let updatedSite = new Site(result.value);
		// Delete Users
		await _db.collection('siteusers')
			.deleteMany( {'siteID': Utils.convertToObjectID(updatedSite.getID())} );
		// Add Users`
		if (siteToSave.users && siteToSave.users.length > 0) {
			let siteUsersMDB = [];
			// Create the list
			siteToSave.users.forEach((user) => {
				// Add
				siteUsersMDB.push({
					"siteID": Utils.convertToObjectID(updatedSite.getID()),
					"userID": Utils.convertToObjectID(user.id)
				});
			});
			// Execute
			await _db.collection('siteusers').insertMany(siteUsersMDB);
		}
		return updatedSite;
	}

	static async handleSaveSiteImage(siteImageToSave) {
		// Check if ID is provided
		if (!siteImageToSave.id) {
			// ID must be provided!
			throw new AppError(
				Constants.CENTRAL_SERVER,
				`Site Image has no ID`,
				550, "SiteStorage", "handleSaveSiteImage");
		}
		// Modify
	    await _db.collection('siteimages').findOneAndUpdate(
			{'_id': Utils.convertToObjectID(siteImageToSave.id)},
			{$set: {image: siteImageToSave.image}},
			{upsert: true, new: true, returnOriginal: false});
	}

	static async handleGetSites(searchValue, companyID, userID, withCompany, withSiteAreas,
			withChargeBoxes, withUsers, numberOfSites) {
		// Check Limit
		numberOfSites = Utils.checkRecordLimit(numberOfSites);
		// Set the filters
		let filters = {};
		// Source?
		if (searchValue) {
			// Build filter
			filters.$or = [
				{ "name" : { $regex : searchValue, $options: 'i' } },
				{ "siteAreas.name" : { $regex : searchValue, $options: 'i' } },
				{ "chargeBoxes._id" : { $regex : searchValue, $options: 'i' } }
			];
		}
		// Set Company?
		if (companyID) {
			filters.companyID = Utils.convertToObjectID(companyID);
		}
		// Create Aggregation
		let aggregation = [];
		// Add Users
		aggregation.push({
			$lookup: {
				from: "siteusers",
				localField: "_id",
				foreignField: "siteID",
				as: "siteusers"
			}
		});
		// Set User?
		if (userID) {
			filters["siteusers.userID"] = Utils.convertToObjectID(userID);
		}
		// Number of Users
		aggregation.push({
			$addFields: {
				"numberOfUsers": { $size: "$siteusers" }
			}
		});
		if (withUsers) {
			// Add
			aggregation.push({
				$lookup: {
					from: "users",
					localField: "siteusers.userID",
					foreignField: "_id",
					as: "users"
				}
			});
		}
		// Add SiteAreas
		aggregation.push({
			$lookup: {
				from: "siteareas",
				localField: "_id",
				foreignField: "siteID",
				as: "siteAreas"
			}
		});
		aggregation.push({
			$addFields: {
				"numberOfSiteAreas": { $size: "$siteAreas" }
			}
		});
		// With Chargers?
		if (withChargeBoxes) {
			aggregation.push({
				$lookup: {
					from: "chargingstations",
					localField: "siteAreas._id",
					foreignField: "siteAreaID",
					as: "chargeBoxes"
				}
			});
		}
		// Filters
		if (filters) {
			aggregation.push({
				$match: filters
			});
		}
		// Add Created By / Last Changed By
		Utils.pushCreatedLastChangedInAggregation(aggregation);
		// Add Company?
		if (withCompany) {
			aggregation.push({
				$lookup: {
					from: "companies",
					localField: "companyID",
					foreignField: "_id",
					as: "company"
				}
			});
			// Single Record
			aggregation.push({
				$unwind: { "path": "$company", "preserveNullAndEmptyArrays": true }
			});
		}
		// Single Record
		aggregation.push({
			$sort: { name : 1 }
		});
		// Limit
		if (numberOfSites > 0) {
			aggregation.push({
				$limit: numberOfSites
			});
		}
		// Read DB
		let sitesMDB = await _db.collection('sites')
			.aggregate(aggregation)
			.toArray();
		// Filter
		if (searchValue) {
			let matchSite = false, matchSiteArea = false, matchChargingStation = false;
			let searchRegEx = new RegExp(searchValue, "i");
			// Sites
			for (var i = 0; i < sitesMDB.length; i++) {
				if (searchRegEx.test(sitesMDB[i].name)) {
					matchSite = true;
					break;
				}
				// Site Areas
				if (sitesMDB[i].siteAreas) {
					for (var j = 0; j < sitesMDB[i].siteAreas.length; j++) {
						// Check Site Area
						if (searchRegEx.test(sitesMDB[i].siteAreas[j].name)) {
							matchSiteArea = true;
							break;
						}
						// Charge Boxes
						if (sitesMDB[i].chargeBoxes) {
							for (var k = 0; k < sitesMDB[i].chargeBoxes.length; k++) {
								// Check Charging Station
								if (searchRegEx.test(sitesMDB[i].chargeBoxes[k]._id)) {
									matchChargingStation = true;
									break;
								}
							}
						}
					}
				}
			}
			// Match Site Area?
			if (!matchSite && matchSiteArea) {
				// Filter the Site Area
				sitesMDB.forEach((siteMDB) => {
					// Site Areas
					if (siteMDB.siteAreas) {
						// Filter
						siteMDB.siteAreas = siteMDB.siteAreas.filter((siteArea) => {
							return searchRegEx.test(siteArea.name);
						});
					}
				});
			// Match Charging Station?
			} else if (!matchSite && matchChargingStation) {
				// Filter the Site Area
				sitesMDB.forEach((siteMDB) => {
					// Charging Stations
					if (siteMDB.chargeBoxes) {
						// Filter Charging Stations
						siteMDB.chargeBoxes = siteMDB.chargeBoxes.filter((chargeBox) => {
							return searchRegEx.test(chargeBox._id);
						});
					}
					// Site Areas
					if (siteMDB.siteAreas) {
						// Filter Site Areas
						siteMDB.siteAreas = siteMDB.siteAreas.filter((siteArea) => {
							let chargeBoxesPerSiteArea = [];
							// Filter Charging Stations
							if (siteMDB.chargeBoxes) {
								// Filter with Site Area
								chargeBoxesPerSiteArea = siteMDB.chargeBoxes.filter((chargeBox) => {
									return chargeBox.siteAreaID.toString() == siteArea._id;
								});
							}
							return chargeBoxesPerSiteArea.length > 0;
						});
					}
				});
			}
		}
		let sites = [];
		// Check
		if (sitesMDB && sitesMDB.length > 0) {
			// Create
			sitesMDB.forEach((siteMDB) => {
				// Create
				let site = new Site(siteMDB);
				// Set Users
				if (withUsers && siteMDB.users) {
					// Set Users
					site.setUsers(siteMDB.users.map((user) => {
						return new User(user);
					}));
				}
				// Set Site Areas
				if (withSiteAreas && siteMDB.siteAreas) {
					// Sort Site Areas
					siteMDB.siteAreas.sort((cb1, cb2) => {
						return cb1.name.localeCompare(cb2.name);
					});
					// Set
					site.setSiteAreas(siteMDB.siteAreas.map((siteArea) => {
						let siteAreaObj = new SiteArea(siteArea);
						// Set Site Areas
						if (siteMDB.chargeBoxes) {
							// Filter with Site Area`
							let chargeBoxesPerSiteArea = siteMDB.chargeBoxes.filter((chargeBox) => {
								return !chargeBox.deleted && chargeBox.siteAreaID.toString() == siteArea._id;
							});
							// Sort Charging Stations
							chargeBoxesPerSiteArea.sort((cb1, cb2) => {
								return cb1._id.localeCompare(cb2._id);
							});
							siteAreaObj.setChargingStations(chargeBoxesPerSiteArea.map((chargeBoxPerSiteArea) => {
								return new ChargingStation(chargeBoxPerSiteArea);
							}));
						}
						return siteAreaObj;
					}));
				}
				// Set Company?
				if (siteMDB.company) {
					site.setCompany(new Company(siteMDB.company));
				}
				// Add
				sites.push(site);
			});
		}
		return sites;
	}

	static async handleDeleteSite(id) {
		// Delete Site Areas
		let siteAreas = await SiteAreaStorage.handleGetSiteAreas(null, id)
		// Delete
		siteAreas.forEach(async (siteArea) => {
			//	Delete Site Area
			await siteArea.delete();
		});
		// Delete Site
		await _db.collection('sites')
			.findOneAndDelete( {'_id': Utils.convertToObjectID(id)} );
		// Delete Image
		await _db.collection('siteimages')
			.findOneAndDelete( {'_id': Utils.convertToObjectID(id)} );
		// Delete Site's Users
		await _db.collection('siteusers')
			.deleteMany( {'siteID': Utils.convertToObjectID(id)} );
	}
}

module.exports = SiteStorage;
