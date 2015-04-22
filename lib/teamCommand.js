"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');
var CommandResult = require('./commandResult');

var TeamCommand = function (Team) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var eventType = {
        createTeamCommand: 'create-team-command',
        updateTeamCommand: 'update-team-command',
        deleteTeamCommand: 'delete-team-command',
        createError: 'create-error',
        updateError: 'update-error',
        deleteError: 'delete-error',
        teamCreated: 'team-created',
        teamUpdated: 'team-updated',
        teamDeleted: 'team-deleted'
    };

    var createTeam = function (commandResult) {
        var team = new Team(commandResult.args);
        team.save(function (err, savedTeam) {
            if(err || !savedTeam) {
                commandResult.err = err;
                teamCreationFailure(commandResult);
            } else {
                commandResult.team = savedTeam;
                teamCreationSuccess(commandResult);
            }
        });
    };

    var teamCreationFailure = function (commandResult) {
        commandResult.message = 'Team not created';
        self.emit(eventType.createError, commandResult);
        if(continueWith) {
            continueWith(null, commandResult);
        }
    };

    var teamCreationSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'Team created';
        self.emit(eventType.teamCreated, commandResult);
        if(continueWith) {
            continueWith(null, commandResult);
        }
    };

    var updateTeam = function (commandResult) {
        var id = commandResult.args._id;
        var teamDetails;

        if (!id) {
            commandResult.err = new Error('ID required to update organisation');
            teamUpdateFailure(commandResult);
            return;
        }

        if(typeof commandResult.args.toObject === 'function') {
            teamDetails = commandResult.args.toObject();
        } else {
            teamDetails = commandResult.args;
        }
        if(teamDetails._id) {
            delete teamDetails._id;
        }

        Team.findByIdAndUpdate(id, {$set: teamDetails}, function (err, updatedTeam) {
            if (err || !updatedTeam) {
                commandResult.err = err;
                teamUpdateFailure(commandResult);
            } else {
                commandResult.team = updatedTeam;
                teamUpdateSuccess(commandResult);
            }
        } );
    };

    var teamUpdateFailure = function (commandResult) {
        commandResult.message = 'Team not updated';
        self.emit(eventType.updateError, commandResult);
        if(continueWith) {
            continueWith(null, commandResult);
        }
    };

    var teamUpdateSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'Team updated';
        self.emit(eventType.teamUpdated, commandResult);
        if(continueWith) {
            continueWith(null, commandResult);
        }
    };


    var deleteTeam = function (commandResult) {
        var teamDetails = commandResult.args;
        var id = teamDetails._id || teamDetails.id;
        var query = {_id: id };

        Team.remove(query, function (err, numberRemoved) {
            if(err || numberRemoved < 1) {
                commandResult.err = err;
                if(!err && (numberRemoved < 1)) {
                    commandResult.err = new Error('Team to remove not found');
                }
                teamDeleteFailure(commandResult);
            } else {
                teamDeleteSuccess(commandResult);
            }
        });
    };

    var teamDeleteFailure = function (commandResult) {
        commandResult.message = 'Team not deleted';
        self.emit(eventType.deleteError, commandResult);
        if(continueWith) {
            continueWith(null, commandResult);
        }
    };

    var teamDeleteSuccess = function (commandResult) {
        commandResult.success = true;
        commandResult.message = 'Team deleted';
        self.emit(eventType.teamDeleted, commandResult);
        if(continueWith) {
            continueWith(null, commandResult);
        }
    };

    self.on(eventType.createTeamCommand, createTeam);
    self.on(eventType.updateTeamCommand, updateTeam);
    self.on(eventType.deleteTeamCommand, deleteTeam);


    self.createTeam = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.createTeamCommand, commandResult);
    };

    self.updateTeam = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.updateTeamCommand, commandResult);
    };

    self.deleteTeam = function (args, next) {
        continueWith = next;
        var commandResult = new CommandResult(args);
        self.emit(eventType.deleteTeamCommand, commandResult);
    };

    self.events = eventType;

    return self;
};

util.inherits(TeamCommand, Emitter);

module.exports = TeamCommand;
