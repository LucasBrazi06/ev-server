const {expect} = require('chai');
const chai = require('chai');
const chaiSubset = require('chai-subset');
chai.use(chaiSubset);
const Factory = require('../factories/Factory');
const CentralServerService = require('./client/CentralServerService');

describe('Site Area tests', function() {
  this.timeout(30000);

  describe('Success cases', () => {
    before(async () => {
      // Create the Company
      this.newCompany = await CentralServerService.createEntity(
        CentralServerService.companyApi, Factory.company.build());
      // Check
      expect(this.newCompany).to.not.be.null;
      // Create the Site
      this.newSite = await CentralServerService.createEntity(
        CentralServerService.siteApi, Factory.site.build({ companyID: this.newCompany.id }));
      // Check
      expect(this.newSite).to.not.be.null;
    });
  
    after(async () => {
      // Delete the Site
      await CentralServerService.deleteEntity(
        CentralServerService.siteApi, this.newSite);
      // Delete the Company
      await CentralServerService.deleteEntity(
        CentralServerService.companyApi, this.newCompany);
    });
    
    it('Should create a new site area', async () => {
      // Check
      expect(this.newSite).to.not.be.null;
      // Create the entity
      this.newSiteArea = await CentralServerService.createEntity(
        CentralServerService.siteAreaApi, Factory.siteArea.build({ siteID: this.newSite.id }));
    });

    it('Should find the created site area by id', async () => {
      // Check if the created entity can be retrieved with its id
      await CentralServerService.getEntityById(
        CentralServerService.siteAreaApi, this.newSiteArea);
    });

    it('Should find the created site area in the site list', async () => {
      // Check if the created entity is in the list
      await CentralServerService.checkEntityInList(
        CentralServerService.siteAreaApi, this.newSiteArea);
    });

    it('Should update the site area', async () => {
      // Change entity
      this.newSiteArea.name = "New Name";
      // Update
      await CentralServerService.updateEntity(
        CentralServerService.siteAreaApi, this.newSiteArea);
    });

    it('Should find the updated site area by id', async () => {
      // Check if the updated entity can be retrieved with its id
      let updatedSiteArea = await CentralServerService.getEntityById(
        CentralServerService.siteAreaApi, this.newSiteArea);
      // Check
      expect(updatedSiteArea.name).to.equal(this.newSiteArea.name);
    });

    it('Should delete the created site area', async () => {
      // Delete the created entity
      await CentralServerService.deleteEntity(
        CentralServerService.siteAreaApi, this.newSiteArea);
    });

    it('Should not find the deleted site area with its id', async () => {
      // Check if the deleted entity cannot be retrieved with its id
      await CentralServerService.checkDeletedEntityById(
        CentralServerService.siteAreaApi, this.newSiteArea);
    });
  });

  describe('Error cases', () => {
    it('Should not create a site area without a site', async () => {
      // Create the entity
      let response = await CentralServerService.createEntity(
        CentralServerService.siteAreaApi, Factory.siteArea.build(), false);
      expect(response.status).to.equal(500);
    });
  });
});
