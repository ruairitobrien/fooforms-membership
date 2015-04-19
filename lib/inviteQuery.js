"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');

var QueryResult = function (args) {
    return {
        args: args,
        success: false,
        err: null,
        message: null,
        data: null
    };
};

var InviteQuery = function (Invite) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var eventType = {
        idQuery: 'id-query',
        search: 'search',
        orgQuery: 'org-query',
        noResult: 'no-result',
        result: 'result'
    };

    var findById = function (queryResult) {
        Invite.findById(queryResult.args.id).lean().exec(function (err, team) {
            if (err || !team) {
                queryResult.err = err;
                notFound(queryResult);
            } else {
                queryResult.data = team;
                found(queryResult);
            }
        });
    };

    var findByOrganisation = function (queryResult) {
        Invite.find({organisation: queryResult.args.organisationId}).lean().exec(function (err, teams) {
            if (err || !teams) {
                queryResult.err = err;
                notFound(queryResult);
            } else {
                queryResult.data = teams;
                found(queryResult);
            }
        });
    };

    var search = function (queryResult) {
        Invite.find(queryResult.args).lean().exec(function (err, docs) {
            if (err || !docs) {
                queryResult.err = err;
                notFound(queryResult);
            } else {
                queryResult.data = docs;
                found(queryResult);
            }
        });
    };

    var notFound = function (queryResult) {
        queryResult.success = false;
        queryResult.message = 'No Invite found';
        self.emit(eventType.noResult, queryResult);
        if (continueWith) {
            continueWith(queryResult.err, queryResult);
        }
    };

    var found = function (queryResult) {
        queryResult.success = true;
        self.emit(eventType.result, queryResult);
        if (continueWith) {
            continueWith(null, queryResult);
        }
    };

    /******************************************************
     * Register Events
     ******************************************************/

    self.on(eventType.idQuery, findById);
    self.on(eventType.orgQuery, findByOrganisation);
    self.on(eventType.teamQuery, search);

    /******************************************************
     * Public methods Events
     ******************************************************/

    self.findById = function (id, next) {
        continueWith = next;
        var queryResult = new QueryResult({id: id});
        self.emit(eventType.idQuery, queryResult);
    };

    self.findByOrganisation = function (organisationId, next) {
        continueWith = next;
        var queryResult = new QueryResult({organisationId: organisationId});
        self.emit(eventType.orgQuery, queryResult);
    };

    self.search = function (args, next) {
        continueWith = next;
        var queryResult = new QueryResult(args);
        self.emit(eventType.search, queryResult);
    };

    self.events = eventType;

    return self;
};

util.inherits(InviteQuery, Emitter);

module.exports = InviteQuery;
