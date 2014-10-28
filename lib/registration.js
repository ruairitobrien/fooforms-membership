"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');

var Application = require('../models/application');
var passwordUtil = require('./passwordUtil');
var OrganisationQuery = require('./organisationQuery');
var OrganisationCommand = require('./organisationCommand');
var UserQuery = require('./userQuery');

var RegisterResult = function () {
    return {
        success: false,
        message: null,
        err: null,
        user: null,
        organisation: null
    };
};

var Registration = function (User, Organisation, Team) {
    Emitter.call(this);
    var self = this;

    var eventType = {
        invalid: 'invalid',
        validated: 'validated',
        userDoesNotExist: 'user-does-not-exist',
        userCreated: 'user-created',
        addUserToOrg: 'add-user-to-org',
        organisationDoesNotExist: 'organisation-does-not-exist',
        organisationUpdated: 'organisation-update',
        applicationReceived: 'application-received',
        registered: 'registered',
        notRegistered: 'not-registered'

    };

    var continueWith = null; // For using the callback with event emitter


    var userQuery = new UserQuery(User);
    var organisationQuery = new OrganisationQuery(Organisation);
    var organisationCommand = new OrganisationCommand(Organisation, Team);


    var validateInputs = function (app) {
        if (!app.displayName || !app.email || !app.password) {
            app.setInvalid('Email, username and password are required');
            self.emit(eventType.invalid, app);
        } else if (!app.organisationName && !app.isInvite) {
            app.setInvalid('Organisation name is required');
            self.emit(eventType.invalid, app);
        } else if (!app.organisation && app.isInvite) {
            app.setInvalid('Organisation is required');
            self.emit(eventType.invalid, app);
        } else if (app.password !== app.confirmPass) {
            app.setInvalid('Password do not match');
            self.emit(eventType.invalid, app);
        } else {
            app.validate();
            self.emit(eventType.validated, app);
        }
    };

    var checkDisplayName = function (displayName, next) {
        userQuery.findUserByDisplayName(displayName, function (err, result) {
            if (err) {
                return next(err);
            } else if (result.success) {
                return next(err, result.success);
            }

            organisationQuery.findOrganisationByDisplayName(displayName, function (err, result) {
                if (err) {
                    return next(err);
                }
                return next(err, result.success);
            });
        });
    };

    var checkIfUserExists = function (app) {
        checkDisplayName(app.displayName, function (err, exists) {
            if (err) {
                app.err = err;
                app.setInvalid('An error occurred verifying username');
                self.emit(eventType.invalid, app);
            }
            if (exists) {
                app.setInvalid('User already exists');
                self.emit(eventType.invalid, app);
            } else {
                userQuery.searchUsers({email: app.email}, function (err, result) {
                    if (err || result.err) {
                        app.err = err || result.err;
                        app.setInvalid('An error occurred verifying user email');
                        self.emit(eventType.invalid, app);
                    }
                    if (result.data && result.data.length > 0) {
                        app.setInvalid('User already exists');
                        self.emit(eventType.invalid, app);
                    } else {
                        self.emit(eventType.userDoesNotExist, app);
                    }
                });
            }
        });
    };


    var createUser = function (app) {
        var user = new User(app);
        user.signInCount = 1;
        user.lastLogin = new Date();
        user.salt = passwordUtil.makeSalt();
        user.password = passwordUtil.encryptPassword(user.password, user.salt);
        user.save(function (err, savedUser) {
            app.user = savedUser;
            if (!app.user || err) {
                app.err = err;
                app.setInvalid('Could not create user');
                self.emit(eventType.invalid, app);
            } else {
                self.emit(eventType.userCreated, app);
            }
        });
    };

    var checkIfOrganisationExists = function (app) {
        if(app.isInvite) {
            Organisation.findById(app.organisation, function (err, organisation) {
                if (err || !organisation) {
                    app.err = err || new Error('Could not find organisation');
                    app.setInvalid(err.message);
                    self.emit(eventType.invalid, app);
                } else {
                    app.organisation = organisation;
                    self.emit(eventType.addUserToOrg, app);
                }
            });

        } else {
            checkDisplayName(app.organisationName, function (err, exists) {
                if (err) {
                    app.err = err;
                    app.setInvalid('An error occurred verifying organisation name');
                    self.emit(eventType.invalid, app);
                }
                if (exists) {
                    app.setInvalid('Organisation already exists');
                    self.emit(eventType.invalid, app);
                } else {
                    self.emit(eventType.organisationDoesNotExist, app);
                }
            });
        }

    };

    var addUserToOrganisation = function (app) {
        Organisation.populate(app.organisation, {path: 'members', model: 'Team'}, function (err, organisation) {
            organisation.members.members.push(app.user);
            organisation.members.save(function (err, members) {
                if(err) {
                    app.err = err;
                    self.emit(eventType.invalid, app);
                } else {
                    app.user.teams.push(members._id);
                    app.user.organisations.push(organisation._id);
                    app.organisation = organisation;
                    app.user.save(function (err, user) {
                        if (err) {
                            app.message = 'Could not save user with organisation details';
                            self.emit(eventType.invalid, app);
                        } else {
                            app.user = user;
                            self.emit(eventType.organisationUpdated, app);
                        }

                    });
                }
            })
        });
    };


    var createOrganisation = function (app) {
        var organisationDetails = {
            displayName: app.organisationName,
            title: app.organisationName,
            billingEmail: app.user.email
        };
        organisationCommand.createOrganisation(organisationDetails, function (err, result) {
            if (err || result.err || !result.organisation) {
                self.emit(eventType.invalid, app);
            } else {

                var organisation = result.organisation;

                Organisation.populate(organisation, {path: 'members owners', model: 'Team'}, function (err, organisation) {
                    if(!organisation.members.members) organisation.members.members = [];
                    if(!organisation.owners.members) organisation.owners.members = [];

                    organisation.members.members.push(app.user._id);
                    organisation.owners.members.push(app.user._id);

                    organisation.members.save(function (err, members) {
                        if(err) app.err = err;

                        organisation.owners.save(function (err, owners) {
                            if(err) app.err = err;

                            app.user.teams.push(owners);
                            app.user.teams.push(members);
                            app.user.organisations.push(organisation._id);
                            app.organisation = organisation;
                            app.user.save(function (err, user) {
                                if (err || app.err) {
                                    app.err = err || app.err;
                                    app.message = 'Could not save user with organisation details';
                                    self.emit(eventType.invalid, app);
                                } else {
                                    self.emit(eventType.organisationUpdated, app);
                                }

                            });
                        })
                    });
                });
            }
        });
    };

    var registrationSuccess = function (app) {
        var regResult = new RegisterResult();
        regResult.success = true;
        regResult.message = 'Successfully registered';
        regResult.user = app.user;
        regResult.organisation = app.organisation;
        self.emit(eventType.registered, app);
        if (continueWith) {
            continueWith(null, regResult);
        }
    };

    var registrationFailed = function (app) {
        var regResult = new RegisterResult();
        regResult.success = false;
        regResult.message = app.message;
        self.emit(eventType.notRegistered, app);
        if (continueWith) {
            continueWith(null, regResult);
        }
    };

    self.on(eventType.applicationReceived, validateInputs);
    self.on(eventType.validated, checkIfUserExists);
    self.on(eventType.userDoesNotExist, createUser);
    self.on(eventType.userCreated, checkIfOrganisationExists);
    self.on(eventType.addUserToOrg, addUserToOrganisation);
    self.on(eventType.organisationDoesNotExist, createOrganisation);
    self.on(eventType.organisationUpdated, registrationSuccess);
    self.on(eventType.invalid, registrationFailed);

    /**
     *
     * @param args
     * @param next
     */
    self.register = function (args, next) {
        continueWith = next;
        var app = new Application(args);
        self.emit(eventType.applicationReceived, app);
    };

    /**
     *
     * @param displayName
     * @param next
     */
    self.checkDisplayNameExists = function (displayName, next) {
        checkDisplayName(displayName, next);
    };

    self.events = eventType;


    return self;
};


util.inherits(Registration, Emitter);

module.exports = Registration;
