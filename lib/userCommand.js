"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');

var CommandResult = function (args) {
    return {
        args: args,
        success: false,
        message: 'Invalid arguments',
        err: null,
        user: null
    };
};

var UserCommand = function (User) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var eventType = {
        createUserCommand: 'create-user-command',
        updateUserCommand: 'update-user-command',
        deleteUserCommand: 'delete-user-command',
        createError: 'create-error',
        updateError: 'update-error',
        deleteError: 'delete-error',
        userCreated: 'user-created',
        userUpdated: 'user-updated',
        userDeleted: 'user-deleted'
    };

    var createUser = function (commandResult) {
        var user = new User(commandResult.args);
        user.save(function (err, savedUser) {
            if (err || !savedUser) {
                commandResult.err = err;
                userCreationFailure(commandResult);
            } else {
                commandResult.user = savedUser;
                userCreationSuccess(commandResult);
            }
        });
    };

    var userCreationFailure = function (commandResult) {
        commandResult.message = 'User not created';
        self.emit(eventType.createError, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    var userCreationSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'User created';
        self.emit(eventType.userCreated, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    var updateUser = function (commandResult) {
        var query;
        var userDetails;

        var id = commandResult.args._id;

        if (id) {
            query = {_id: id};
        } else if (commandResult.args.displayName) {
            query = {displayName: commandResult.args.displayName};
        } else {
            commandResult.err = new Error('No valid query to update the user');
            userUpdateFailure(commandResult);
            return;
        }

        if (typeof commandResult.args.toObject === 'function') {
            userDetails = commandResult.args.toObject();
        } else {
            userDetails = commandResult.args;
        }

        if (userDetails._id) {
            delete userDetails._id;
        }


        User.findOneAndUpdate(query, userDetails, {upsert: false, "new": false}).exec(
            function (err, updatedUser) {
                if (err || !updatedUser) {
                    commandResult.err = err;
                    userUpdateFailure(commandResult);
                } else {
                    commandResult.user = updatedUser;
                    userUpdateSuccess(commandResult);
                }
            });
    };

    var userUpdateFailure = function (commandResult) {
        commandResult.message = 'User not updated';
        self.emit(eventType.updateError, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    var userUpdateSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'User updated';
        self.emit(eventType.userUpdated, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };


    var deleteUser = function (commandResult) {
        var userDetails = commandResult.args;
        var query;

        var id = userDetails._id || userDetails.id;
        if (id) {
            query = {_id: id};
        } else if (userDetails.displayName) {
            query = {displayName: userDetails.displayName};
        } else {
            userDeleteFailure(commandResult);
            return;
        }

        User.remove(query, function (err, numberRemoved) {
            if (err || (numberRemoved < 1)) {
                commandResult.err = err;
                if (!err && (numberRemoved < 1)) {
                    commandResult.err = new Error('User to remove not found');
                }
                userDeleteFailure(commandResult);
            } else {
                userDeleteSuccess(commandResult);
            }
        });
    };

    var userDeleteFailure = function (commandResult) {
        commandResult.message = 'User not deleted';
        self.emit(eventType.deleteError, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    var userDeleteSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'User deleted';
        self.emit(eventType.userDeleted, commandResult);
        if (continueWith) {
            continueWith(null, commandResult);
        }
    };

    // Create user events
    self.on(eventType.createUserCommand, createUser);

    // Update user events
    self.on(eventType.updateUserCommand, updateUser);

    // Delete user events
    self.on(eventType.deleteUserCommand, deleteUser);


    self.createUser = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.createUserCommand, commandResult);
    };

    self.updateUser = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.updateUserCommand, commandResult);
    };

    self.deleteUser = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.deleteUserCommand, commandResult);
    };

    self.events = eventType;

    return self;
};

util.inherits(UserCommand, Emitter);

module.exports = UserCommand;
