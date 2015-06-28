"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');

var Registration = require('./lib/registration');
var Authentication = require('./lib/authentication');
var UserQuery = require('./lib/userQuery');
var UserCommand = require('./lib/userCommand');
var OrganisationQuery = require('./lib/organisationQuery');
var OrganisationCommand = require('./lib/organisationCommand');
var TeamQuery = require('./lib/teamQuery');
var TeamCommand = require('./lib/teamCommand');
var InviteQuery = require('./lib/inviteQuery');
var InviteCommand = require('./lib/inviteCommand');
var passwordUtil = require('./lib/passwordUtil');

var Membership = function (dbConnection) {
    Emitter.call(this);
    var self = this;

    var User = require('./models/user')(dbConnection);
    var Organisation = require('./models/organisation')(dbConnection);
    var Team = require('./models/team')(dbConnection);
    var Invite = require('./models/invite')(dbConnection);

    var _userQuery = new UserQuery(User);
    var _organisationQuery = new OrganisationQuery(Organisation);
    var _teamQuery = new TeamQuery(Team);
    var _inviteQuery = new InviteQuery(Invite);

    var eventTypes = {
        authenticated: 'authenticated',
        notAuthenticated: 'not-authenticated',
        registered: 'registered',
        notRegistered: 'not-registered',
        displayNameExists: 'display-name-exists'
    };

    self.events = eventTypes;

    /**
     * Expose models in case they are needed
     */
    self.User = User;
    self.Organisation = Organisation;
    self.Team = Team;


    /**
     * Verify a users username and password
     *
     * @param username
     * @param password
     * @param next
     */
    self.authenticate = function (username, password, next) {
        var auth = new Authentication(User);

        auth.on(auth.events.authenticated, function (authResult) {
            self.emit(eventTypes.authenticated, authResult);
        });
        auth.on(auth.events.notAuthenticated, function (authResult) {
            self.emit(eventTypes.notAuthenticated, authResult);
        });

        auth.authenticate({username: username, password: password}, next);
    };

    /**
     * Register a new User and Organisation
     *
     * @param details
     * @param next
     */
    self.register = function (details, next) {
        var registration = new Registration(User, Organisation, Team);

        registration.on(registration.events.registered, function (regResult) {
            self.emit(eventTypes.registered, regResult);
        });

        registration.on(registration.events.notRegistered, function (regResult) {
            self.emit(eventTypes.notRegistered, regResult);
        });

        registration.register(details, next);
    };

    /*******************************************************************************************************************
     * USER COMMANDS
     */
    self.updateUser = function (args, next) {
        var userCommand = new UserCommand(User);
        userCommand.updateUser(args, next);
    };

    /*******************************************************************************************************************
     * USER QUERIES
     */

    /**
     * Check if a displayName exists. This searches across the User and Organisation collections
     * since the displayName must be unique across both.
     *
     * @param displayName
     * @param next
     */
    self.checkDisplayNameExists = function (displayName, next) {
        var registration = new Registration(User, Organisation, Team);
        registration.checkDisplayNameExists(displayName, next);
    };

    /**
     * Find a user by ID using a mongo ObjectID
     *
     * @param id
     * @param next
     */
    self.findUserById = function (id, next) {
        _userQuery.findUserById(id, next);
    };

    /**
     * Find a user by their displayName i.e. username
     *
     * @param displayName
     * @param next
     */
    self.findUserByDisplayName = function (displayName, next) {
        _userQuery.findUserByDisplayName(displayName, next);
    };

    /**
     * Find a user by their email address
     *
     * @param email
     * @param next
     */
    self.findUserByEmail = function (email, next) {
        _userQuery.findUserByEmail(email, next);
    };

    /**
     * Allow searching of the User collection using the mongoose query language
     *
     * @param query
     * @param next
     */
    self.searchUsers = function (query, next) {
        _userQuery.searchUsers(query, next);
    };

    /*******************************************************************************************************************
     * TEAM COMMANDS
     */
    self.createTeam = function (args, next) {
        var teamCommand = new TeamCommand(Team);
        teamCommand.createTeam(args, next);
    };

    self.updateTeam = function (args, next) {
        var teamCommand = new TeamCommand(Team);
        teamCommand.updateTeam(args, next);
    };

    self.deleteTeam = function (args, next) {
        var teamCommand = new TeamCommand(Team);
        teamCommand.deleteTeam(args, next);
    };


    /*******************************************************************************************************************
     * TEAM QUERIES
     */
    self.findTeamById = function (id, next) {
        _teamQuery.findTeamById(id, next);
    };

    self.searchTeams = function (query, next) {
        _teamQuery.search(query, next);
    };

    /*******************************************************************************************************************
     * ORGANISATION COMMANDS
     */
    self.createOrganisation = function (args, next) {
        var organisationCommand = new OrganisationCommand(Organisation, Team);
        organisationCommand.createOrganisation(args, next);
    };

    self.updateOrganisation = function (args, next) {
        var organisationCommand = new OrganisationCommand(Organisation, Team);
        organisationCommand.updateOrganisation(args, next);
    };

    self.deleteOrganisation = function (args, next) {
        var organisationCommand = new OrganisationCommand(Organisation, Team);
        organisationCommand.deleteOrganisation(args, next);
    };

    /*******************************************************************************************************************
     * ORGANISATION QUERIES
     */
    self.findOrganisationById = function (id, next) {
        _organisationQuery.findOrganisationById(id, next);
    };

    self.findOrganisationByDisplayName = function (displayName, next) {
        _organisationQuery.findOrganisationByDisplayName(displayName, next);
    };

    self.searchOrganisations = function (query, next) {
        _organisationQuery.searchOrganisations(query, next);
    };

    /*******************************************************************************************************************
     * INVITE COMMANDS
     */
    self.createOneOffInvite = function (args, next) {
        var inviteCommand = new InviteCommand(Invite);
        inviteCommand.createOneOffInvite(args, next);
    };

    self.createOpenInvite = function (args, next) {
        var inviteCommand = new InviteCommand(Invite);
        inviteCommand.createOpenInvite(args, next);
    };

    self.updateInvite = function (args, next) {
        var inviteCommand = new InviteCommand(Invite);
        inviteCommand.update(args, next);
    };

    self.removeInvite = function (args, next) {
        var inviteCommand = new InviteCommand(Invite);
        inviteCommand.remove(args, next);
    };

    /*******************************************************************************************************************
     * INVITE QUERIES
     */
    self.findInviteById = function (id, next) {
        _inviteQuery.findById(id, next);
    };

    /*******************************************************************************************************************
     * PASSWORD
     */
    self.passwordUtil = passwordUtil;
};

util.inherits(Membership, Emitter);

module.exports = Membership;
