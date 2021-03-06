"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');
var CommandResult = require('./commandResult');

var OrganisationCommand = function (Organisation, Team) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var eventType = {
        createOrgCommand: 'create-org-command',
        updateOrgCommand: 'update-org-command',
        deleteOrgCommand: 'delete-org-command',
        createError: 'create-error',
        updateError: 'update-error',
        deleteError: 'delete-error',
        orgCreated: 'org-created',
        orgUpdated: 'org-updated',
        orgDeleted: 'org-deleted'
    };

    var createOrganisation = function (commandResult) {
        var organisation = new Organisation(commandResult.args);
        organisation.save(function (err, savedOrg) {
            if (err || !savedOrg) {
                commandResult.err = err;
                organisationCreationFailure(commandResult);
            } else {
                commandResult.organisation = savedOrg;
                createTeams(commandResult);
            }
        });
    };

    var createTeams = function (commandResult) {
        var org = commandResult.organisation;
        var owners = new Team({
            displayName: org.displayName + '-owners',
            title: org.title + ' Owners',
            description: 'Owners of ' + org.title,
            permissionLevel: 'admin',
            organisation: org._id
        });
        var members = new Team({
            displayName: org.displayName + '-members',
            title: org.title + ' Members',
            description: 'Members of ' + org.title,
            organisation: org._id
        });

        owners.save(function (err, savedOwners) {
            if (err) {
                commandResult.err = err;
                organisationCreationFailure(commandResult);
            }
            members.save(function (err, savedMembers) {
                if (err) {
                    commandResult.err = err;
                    organisationCreationFailure(commandResult);
                }
                commandResult.organisation.members = savedMembers._id;
                commandResult.organisation.owners = savedOwners._id;

                commandResult.organisation.save(function (err, orgSaveResult) {
                    if (err) {
                        commandResult.err = err;
                        organisationCreationFailure(commandResult);
                    } else {
                        commandResult.organisation = orgSaveResult;
                        organisationCreationSuccess(commandResult);
                    }
                });
            });
        });

    };

    var organisationCreationFailure = function (commandResult) {
        commandResult.message = 'Organisation not created';
        self.emit(eventType.createError, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    var organisationCreationSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'Organisation created';
        self.emit(eventType.orgCreated, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    var updateOrganisation = function (commandResult) {
        var orgDetails;
        var id = commandResult.args._id;

        if (!id) {
            commandResult.err = new Error('ID required to update organisation');
            organisationUpdateFailure(commandResult);
            return;
        }

        if (typeof commandResult.args.toObject === 'function') {
            orgDetails = commandResult.args.toObject();
        } else {
            orgDetails = commandResult.args;
        }

        if (orgDetails._id) {
            delete orgDetails._id;
        }

        Organisation.findByIdAndUpdate(id, {$set: orgDetails}, function (err, updatedOrganisation) {
            if (err || !updatedOrganisation) {
                commandResult.err = err;
                organisationUpdateFailure(commandResult);
            } else {
                commandResult.organisation = updatedOrganisation;
                organisationUpdateSuccess(commandResult);
            }
        });
    };

    var organisationUpdateFailure = function (commandResult) {
        commandResult.message = 'Organisation not updated';
        self.emit(eventType.updateError, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    var organisationUpdateSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'Organisation updated';
        self.emit(eventType.orgUpdated, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };


    var deleteOrganisation = function (commandResult) {
        var orgDetails = commandResult.args;
        var id = orgDetails._id || orgDetails.id;
        var query;

        if (id) {
            query = {_id: id};
        } else if (orgDetails.displayName) {
            query = {displayName: orgDetails.displayName};
        } else {
            organisationDeleteFailure(commandResult);
            return;
        }

        Organisation.remove(query, function (err, numberRemoved) {
            if (err || (numberRemoved < 1)) {
                commandResult.err = err;
                if (!err && (numberRemoved < 1)) {
                    commandResult.err = new Error('Organisation to remove not found');
                }
                organisationDeleteFailure(commandResult);
            } else {
                organisationDeleteSuccess(commandResult);
            }
        });
    };

    var organisationDeleteFailure = function (commandResult) {
        commandResult.message = 'Organisation not deleted';
        self.emit(eventType.deleteError, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    var organisationDeleteSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'Organisation deleted';
        self.emit(eventType.orgDeleted, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    self.on(eventType.createOrgCommand, createOrganisation);
    self.on(eventType.updateOrgCommand, updateOrganisation);
    self.on(eventType.deleteOrgCommand, deleteOrganisation);


    self.createOrganisation = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.createOrgCommand, commandResult);
    };

    self.updateOrganisation = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.updateOrgCommand, commandResult);
    };

    self.deleteOrganisation = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.deleteOrgCommand, commandResult);
    };

    self.events = eventType;

    return self;
};

util.inherits(OrganisationCommand, Emitter);

module.exports = OrganisationCommand;
