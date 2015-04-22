"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');
var validator = require('validator');
var CommandResult = require('./commandResult');


function InviteCommand(Invite) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var eventType = {
        createOneOffInviteCommand: 'create-one-off-invite-command',
        createOpenInviteCommand: 'create-open-invite-command',
        createCommand: 'create-command',
        updateCommand: 'update-command',
        deleteCommand: 'delete-command',
        createError: 'create-error',
        updateError: 'update-error',
        deleteError: 'delete-error',
        created: 'created',
        updated: 'updated',
        deleted: 'deleted'
    };

    function create(commandResult) {
        var invite = new Invite(commandResult.args);
        invite.save(function (err, savedInvite) {
            if (err || !savedInvite) {
                commandResult.err = err;
                creationFailure(commandResult);
            } else {
                commandResult.entity = savedInvite;
                creationSuccess(commandResult);
            }
        });
    }

    function creationFailure(commandResult) {
        commandResult.message = 'Invite not created';
        self.emit(eventType.createError, commandResult);
        if (continueWith) {
            continueWith(commandResult.err, commandResult);
        }
    }

    function creationSuccess(commandResult) {
        commandResult.success = true;
        commandResult.message = 'Invite created';
        self.emit(eventType.created, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    }

    function update(commandResult) {
        var id = commandResult.args._id;
        var entity;

        if (!id) {
            commandResult.err = new Error('ID required to update invite');
            updateFailure(commandResult);
            return;
        }

        if (typeof commandResult.args.toObject === 'function') {
            entity = commandResult.args.toObject();
        } else {
            entity = commandResult.args;
        }
        if (entity._id) {
            delete entity._id;
        }

        Invite.findByIdAndUpdate(id, {$set: entity}, function (err, updatedEntity) {
            if (err || !updatedEntity) {
                commandResult.err = err;
                updateFailure(commandResult);
            } else {
                commandResult.entity = updatedEntity;
                updateSuccess(commandResult);
            }
        });
    }

    function updateFailure(commandResult) {
        commandResult.message = 'Invite not updated';
        self.emit(eventType.updateError, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    }

    function updateSuccess(commandResult) {
        commandResult.success = true;
        commandResult.message = 'Invite updated';
        self.emit(eventType.updated, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    }

    function remove(commandResult) {
        var entity = commandResult.args;
        var id = entity._id || entity.id;
        var query = {_id: id};

        Invite.remove(query, function (err, numberRemoved) {
            if (err || numberRemoved < 1) {
                commandResult.err = err;
                if (!err && (numberRemoved < 1)) {
                    commandResult.err = new Error('Invite to remove not found');
                }
                deleteFailure(commandResult);
            } else {
                deleteSuccess(commandResult);
            }
        });
    }

    function deleteFailure(commandResult) {
        commandResult.message = 'Invite not deleted';
        self.emit(eventType.deleteError, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    }

    function deleteSuccess(commandResult) {
        commandResult.success = true;
        commandResult.message = 'Invite deleted';
        self.emit(eventType.deleted, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    }

    /**
     * A one off invite needs to have an email, inviter, organisation,
     * status of pending, maxTimesUsed of 1 and inviteType of Single.
     *
     * @param commandResult
     */
    function validateOneOffInvite(commandResult) {
        var errorMessage = '';
        var invite = commandResult.args;
        if (!validator.isMongoId(validator.toString(invite.organisation))) errorMessage += 'Organisation ID is required. ';
        if (!validator.isMongoId(validator.toString(invite.inviter))) errorMessage += 'Inviter is required. ';
        if (!validator.isEmail(invite.email)) errorMessage += 'Email is required and must be a valid email. ';
        if (!validator.equals(invite.status, 'pending')) errorMessage += 'Status must equal pending. ';
        if (invite.maxTimesUsed !== 1) errorMessage += 'Max times used must be set to 1 for single invite. ';
        if (!validator.equals(invite.inviteType, 'Single')) errorMessage += 'Invite type must be Single. ';

        if (errorMessage) {
            commandResult.err = new Error(errorMessage);
            creationFailure(commandResult);
            return false;
        } else {
            return true;
        }

    }

    function validateOpenInvite() {
        return true;
    }


    self.on(eventType.createCommand, create);
    self.on(eventType.updateCommand, update);
    self.on(eventType.deleteCommand, remove);


    self.create = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.createCommand, commandResult);
    };

    self.update = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.updateCommand, commandResult);
    };

    self.remove = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.deleteCommand, commandResult);
    };

    self.createOneOffInvite = function (args, next) {
        continueWith = next;

        args.status = 'pending';
        args.maxTimesUsed = 1;
        args.inviteType = 'Single';

        var commandResult = new CommandResult(args);

        if (validateOneOffInvite(commandResult)) {
            self.emit(eventType.createCommand, commandResult);
        }
    };

    self.createOpenInvite = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        if (validateOpenInvite(commandResult)) {
            self.emit(eventType.createCommand, commandResult);
        }
    };

    self.events = eventType;

    return self;
}

util.inherits(InviteCommand, Emitter);

module.exports = InviteCommand;
