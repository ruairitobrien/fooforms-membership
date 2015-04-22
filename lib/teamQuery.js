"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');
var QueryResult = require('./queryResult');

var TeamQuery = function (Team) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var eventType = {
        idQuery: 'id-query',
        orgQuery: 'org-query',
        teamQuery: 'team-query',
        noResult: 'no-result',
        result: 'result'
    };

    var findTeamById = function (queryResult) {
        Team.findById(queryResult.args.id).lean().exec(function (err, team) {
            if(err || !team) {
                queryResult.err = err;
                noTeamFound(queryResult);
            } else {
                queryResult.data = team;
                teamsFound(queryResult);
            }
        });
    };

    var findTeamsByOrganisation = function (queryResult) {
        Team.find({organisation: queryResult.args.organisationId}).lean().exec(function (err, teams) {
            if(err || !teams) {
                queryResult.err = err;
                noTeamFound(queryResult);
            } else {
                queryResult.data = teams;
                teamsFound(queryResult);
            }
        });
    };

    var search = function (queryResult) {
        Team.find(queryResult.args).populate('members').exec(function (err, teams) {
            if(err || !teams) {
                queryResult.err = err;
                noTeamFound(queryResult);
            } else {
                queryResult.data = teams;
                teamsFound(queryResult);
            }
        });
    };

    var noTeamFound = function (queryResult) {
        queryResult.success = false;
        queryResult.message = 'No Team found';
        self.emit(eventType.noResult, queryResult);
        if(continueWith) {
            continueWith(null, queryResult);
        }
    };

    var teamsFound = function (queryResult) {
        queryResult.success = true;
        self.emit(eventType.result, queryResult);
        if(continueWith) {
            continueWith(null, queryResult);
        }
    };

    self.on(eventType.idQuery, findTeamById);
    self.on(eventType.orgQuery, findTeamsByOrganisation);
    self.on(eventType.teamQuery, search);

    self.findTeamById = function (id, next) {
        continueWith = next;
        var queryResult = new QueryResult({id: id});
        self.emit(eventType.idQuery, queryResult);
    };

    self.findTeamByOrganisation = function (organisationId, next) {
        continueWith = next;
        var queryResult = new QueryResult({organisationId: organisationId});
        self.emit(eventType.orgQuery, queryResult);
    };

    self.search = function (args, next) {
        continueWith = next;
        var queryResult = new QueryResult(args);
        self.emit(eventType.teamQuery, queryResult);
    };

    self.events = eventType;

    return self;
};

util.inherits(TeamQuery, Emitter);

module.exports = TeamQuery;
