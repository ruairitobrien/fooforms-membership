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
        message: '',
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

    var handleError = function (app, message, err) {
        app.setInvalid(message, err);
        rollback(app);
    };

    var rollback = function (app) {
        if (app.user && app.user._id) {
            User.remove({_id: app.user._id}, function () {
                if (app.organisation && app.organisation._id) {
                    Organisation.remove({_id: app.organisation._id}, function () {
                        if (app.organisation.owners && app.organisation.owners._id) {
                            Team.remove({_id: app.organisation.owners._id}, function () {
                                if (app.organisation.members && app.organisation.members._id) {
                                    Team.remove({_id: app.organisation.members._id}, function () {
                                        self.emit(eventType.invalid, app);
                                    });
                                } else {
                                    self.emit(eventType.invalid, app);
                                }
                            })
                        } else {
                            self.emit(eventType.invalid, app);
                        }
                    })
                } else {
                    self.emit(eventType.invalid, app);
                }
            });
        } else {
            self.emit(eventType.invalid, app);
        }
    };


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
            } else if (result && result.success) {
                return next(null, result.success);
            }

            organisationQuery.findOrganisationByDisplayName(displayName, function (err, result) {
                if (err) {
                    return next(err);
                }
                return next(null, result.success);
            });
        });
    };

    var checkIfUserExists = function (app) {
        checkDisplayName(app.displayName, function (err, exists) {
            if (err) {
                handleError(app, 'An error occurred verifying username', err);
            } else {
                if (exists) {
                    handleError(app, 'User already exists');
                } else {
                    userQuery.searchUsers({email: app.email}, function (err, result) {
                        if (err || result.err) {
                            var currentErr = err || result.err;
                            handleError(app, 'An error occurred verifying user email', currentErr);
                        } else {
                            if (result.data && result.data.length > 0) {
                                handleError(app, 'User already exists');
                            } else {
                                self.emit(eventType.userDoesNotExist, app);
                            }
                        }
                    });
                }
            }
        });
    };


    var createUser = function (app) {
        var user = new User(app);
        user.signInCount = 1;
        user.lastLogin = new Date();
        try {
            user.salt = passwordUtil.makeSalt();
            user.password = passwordUtil.encryptPassword(user.password, user.salt);
        } catch (err) {
            return handleError(app, 'Error during password encryption', err);
        }

        user.save(function (err, savedUser) {
            app.user = savedUser;
            if (!app.user || err) {
                handleError(app, 'Could not create user', err);
            } else {
                self.emit(eventType.userCreated, app);
            }
        });
    };

    var checkIfOrganisationExists = function (app) {
        if (app.isInvite) {
            Organisation.findById(app.organisation, function (err, organisation) {
                if (err || !organisation) {
                    var message = 'Could not find organisation';
                    var currentErr = err || new Error(message);
                    handleError(message, 'Could not find organisation', currentErr);
                } else {
                    app.organisation = organisation;
                    self.emit(eventType.addUserToOrg, app);
                }
            });

        } else {
            checkDisplayName(app.organisationName, function (err, exists) {
                if (err) {
                    handleError(app, 'An error occurred verifying organisation name', err);
                } else {
                    if (exists) {
                        handleError(app, 'Organisation already exists');
                    } else {
                        self.emit(eventType.organisationDoesNotExist, app);
                    }
                }
            });
        }

    };

    var addUserToOrganisation = function (app) {
        Organisation.populate(app.organisation, {path: 'members', model: 'Team'}, function (err, organisation) {
            organisation.members.members.push(app.user);
            organisation.members.save(function (err, members) {
                if (err) {
                    handleError(app, 'Could not save user to organisation', err);
                } else {
                    app.user.teams.push(members._id);
                    app.user.organisations.push(organisation._id);
                    app.organisation = organisation;
                    app.user.save(function (err, user) {
                        if (err) {
                            handleError(app, 'Could not save user with organisation details', err);
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
                var message = 'Could not create organisation';
                var currentErr = err || result.err || new Error(message);
                handleError(app, message, currentErr);
            } else {
                var organisation = result.organisation;
                Organisation.populate(organisation, {
                    path: 'members owners',
                    model: 'Team'
                }, function (err, organisation) {
                    if (err) {
                        handleError(app, 'Error creating organisation teams', err);
                    } else {
                        if (!organisation.members.members) organisation.members.members = [];
                        if (!organisation.owners.members) organisation.owners.members = [];

                        organisation.members.members.push(app.user._id);
                        organisation.owners.members.push(app.user._id);

                        organisation.members.save(function (err, members) {
                            if (err) {
                                handleError(app, 'Error adding user to organisation teams', err);
                            } else {
                                organisation.owners.save(function (err, owners) {
                                    if (err) {
                                        handleError(app, 'Error adding user to organisation teams', err);
                                    } else {
                                        app.user.teams.push(owners);
                                        app.user.teams.push(members);
                                        app.user.organisations.push(organisation._id);
                                        app.organisation = organisation;
                                        app.user.save(function (err, user) {
                                            if (err) {
                                                handleError(app, 'Could not save user with organisation details', err);
                                            } else {
                                                self.emit(eventType.organisationUpdated, app);
                                            }

                                        });
                                    }
                                })
                            }
                        });
                    }

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
