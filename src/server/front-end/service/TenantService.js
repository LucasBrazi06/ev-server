const Logging = require( '../../../utils/Logging');
const Database = require( '../../../utils/Database');
const AppError = require( '../../../exception/AppError');
const AppAuthError = require( '../../../exception/AppAuthError');
const BadRequestError = require( '../../../exception/BadRequestError');
const ConflictError = require( '../../../exception/ConflictError');
const NotFoundError = require( '../../../exception/NotFoundError');
const {
    ACTION_CREATE,
    ACTION_DELETE,
    ACTION_LIST,
    ACTION_READ,
    ACTION_UPDATE,
    CENTRAL_SERVER,
    ENTITY_TENANT,
    ENTITY_TENANTS,
    REST_RESPONSE_SUCCESS
} = require( '../../../utils/Constants');
const Tenant = require( '../../../model/Tenant');
const User = require( '../../../model/User');
const Authorizations = require( '../../../authorization/Authorizations');
const TenantSecurity = require( './security/TenantSecurity');
const {CREATED, OK} = require( 'http-status-codes');
const TenantValidator = require( '../validation/TenantValidation').default;

class TenantService {
    static async handleDeleteTenant(action, req, res, next){
        try {
            // Filter
            let filteredRequest = TenantSecurity.filterTenantDeleteRequest(
            req.query, req.user);
            // Check Mandatory fields
            if (!filteredRequest.ID) {
                // Not Found!
                throw new AppError(
                CENTRAL_SERVER,
                `The Tenant's ID must be provided`, 400);
            }
            // Get
            let tenant = await Tenant.getTenant(filteredRequest.ID);
            // Found?
            if (!tenant) {
                // Not Found!
                throw new NotFoundError(
                `The Tenant with ID '${filteredRequest.id}' does not exist`);
            }
            // Check auth
            if (!Authorizations.canDeleteTenant(req.user, tenant.getModel())) {
                // Not Authorized!
                throw new AppAuthError(
                ACTION_DELETE,
                ENTITY_TENANT,
                tenant.getID(),
                user = req.user);
            }
            // Delete
            await tenant.delete();
            // Log
            Logging.logSecurityInfo({
                user: req.user,
                module: 'TenantService',
                method: 'handleDeleteTenant',
                message: `Tenant '${tenant.getName()}' has been deleted successfully`,
                action: action,
                detailedMessages: tenant
            });
            // Ok
            res.json(REST_RESPONSE_SUCCESS);
            next();
        } catch (error) {
            TenantService._handleError(error, req, next, action, 'handleDeleteTenant');
        }
    }

    static async handleGetTenant(action, req, res, next){
        try {
            // Filter
            let filteredRequest = TenantSecurity.filterTenantRequest(req.query, req.user);
            // Charge Box is mandatory
            if (!filteredRequest.ID) {
                // Not Found!
                throw new BadRequestError([]);
            }
            // Get it
            let tenant = await Tenant.getTenant(filteredRequest.ID);
            if (!tenant) {
                throw new NotFoundError(
                `The Tenant with ID '${filteredRequest.id}' does not exist`);
            }
            // Check auth
            if (!Authorizations.canReadTenant(req.user, tenant.getModel())) {
                // Not Authorized!
                throw new AppAuthError(
                ACTION_READ,
                ENTITY_TENANT,
                user = req.user);
            }
            // Return
            res.json(
            // Filter
            TenantSecurity.filterTenantResponse(
            tenant.getModel(), req.user)
            );
            next();
        } catch (error) {
            TenantService._handleError(error, req, next, action, 'handleGetTenant');
        }
    }

    static async handleGetTenants(action, req, res, next){
        try {
            // Check auth
            if (!Authorizations.canListTenants(req.user)) {
                // Not Authorized!
                throw new AppAuthError(
                ACTION_LIST,
                ENTITY_TENANTS,
                user = req.user);
            }
            // Filter
            let filteredRequest = TenantSecurity.filterTenantsRequest(req.query, req.user);
            // Get the tenants
            let tenants = await Tenant.getTenants({
                search: filteredRequest.Search
            },
            filteredRequest.Limit, filteredRequest.Skip, filteredRequest.Sort);
            // Set
            tenants.result = tenants.result.map((tenant) => tenant.getModel());
            // Filter
            tenants.result = TenantSecurity.filterTenantsResponse(
            tenants.result, req.user);
            // Return
            res.json(tenants);
            next();
        } catch (error) {
            TenantService._handleError(error, req, next, action, 'handleGetTenants');
        }
    }

    static async handleCreateTenant(action, req, res, next){
        try {
            // Check auth
            if (!Authorizations.canCreateTenant(req.user)) {
                // Not Authorized!
                throw new AppAuthError(
                ACTION_CREATE,
                ENTITY_TENANT,
                user = req.user);
            }
            TenantValidator.validateTenantCreation(req.body);
            // Filter
            let filteredRequest = TenantSecurity.filterTenantCreateRequest(req.body, req.user);

            let foundTenant = await Tenant.getTenantByName(filteredRequest.name);
            if (foundTenant) {
                throw new ConflictError(`The tenant with name '${filteredRequest.name}' already exists`, 'tenants.name_already_used', {
                    'name': filteredRequest.name
                },
                'TenantService', 'handleCreateTenant', req.user, action);
            }

            foundTenant = await Tenant.getTenantBySubdomain(filteredRequest.subdomain);
            if (foundTenant) {
                throw new ConflictError(`The tenant with subdomain '${filteredRequest.subdomain}' already exists`, 'tenants.subdomain_already_used', {
                    'subdomain': filteredRequest.subdomain
                });
            }

            // Create
            let tenant = new Tenant(filteredRequest);
            // Update timestamp
            tenant.setCreatedBy(new User({
                'id': req.user.id
            }));
            tenant.setCreatedOn(new Date());
            // Save
            let newTenant = await tenant.save();

            await tenant.createEnvironment();

            // Log
            Logging.logSecurityInfo({
                user: req.user,
                module: 'TenantService',
                method: 'handleCreateTenant',
                message: `Tenant '${newTenant.getName()}' has been created successfully`,
                action: action,
                detailedMessages: newTenant
            });
            // Ok
            res.status(CREATED).json({
                id: newTenant.getID()
            });
            next();
        } catch (error) {
            TenantService._handleError(error, req, next, action, 'handleCreateTenant');
        }
    }

    static async handleUpdateTenant(action, req, res, next){
        try {
            // Filter
            TenantValidator.validateTenantUpdate(req.body);
            let filteredRequest = TenantSecurity.filterTenantUpdateRequest(req.body, req.user);

            // Check email
            let tenant = await Tenant.getTenant(filteredRequest.id);
            if (!tenant) {
                throw new NotFoundError(
                `The Tenant with ID '${filteredRequest.id}' does not exist`);
            }
            // Check auth
            if (!Authorizations.canUpdateTenant(req.user, tenant.getModel())) {
                // Not Authorized!
                throw new AppAuthError(
                ACTION_UPDATE,
                ENTITY_TENANT,
                tenant.getID(),
                user = req.user);
            }
            // Update
            Database.updateTenant(filteredRequest, tenant.getModel());
            // Update timestamp
            tenant.setLastChangedBy(new User({
                'id': req.user.id
            }));
            tenant.setLastChangedOn(new Date());
            // Update Tenant
            let updatedTenant = await tenant.save();
            // Log
            Logging.logSecurityInfo({
                user: req.user,
                module: 'TenantService',
                method: 'handleUpdateTenant',
                message: `Tenant '${updatedTenant.getName()}' has been updated successfully`,
                action: action,
                detailedMessages: updatedTenant
            });
            // Ok
            res.json(REST_RESPONSE_SUCCESS);
            next();
        } catch (error) {
            TenantService._handleError(error, req, next, action, 'handleUpdateTenant');
        }
    }

    static async handleVerifyTenant(action, req, res, next){
        try {
            // Filter
            let filteredRequest = TenantSecurity.filterVerifyTenantRequest(req.headers);
            // Check email
            let tenant = await Tenant.getTenantBySubdomain(filteredRequest.tenant);
            if (!tenant) {
                throw new NotFoundError(
                `The Tenant with subdomain '${filteredRequest.subdomain}' does not exist`);
            }
            res.status(OK).send({});
            next();
        } catch (error) {
            TenantService._handleError(error, req, next, action, 'handleVerifyTenant');
        }
    }

    static _handleError(error, req, next, action, method){
        Logging.logException(error, action, CENTRAL_SERVER, 'TenantService', method, req.user);
        next(error);
    }
}

module.exports = TenantService;
