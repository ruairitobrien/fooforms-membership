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

var OrganisationQuery = function (Organisation) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var eventType = {
        idQuery: 'id-query',
        displayNameQuery: 'display-name-query',
        searchQuery: 'search-query',
        noResult: 'no-result',
        result: 'result'
    };

    var findOrganisationById = function (queryResult) {
        Organisation.findById(queryResult.args.id).lean().exec(function (err, organisation) {
            if(err || !organisation) {
                queryResult.err = err;
                noOrganisationsFound(queryResult);
            } else {
                queryResult.data = organisation;
                organisationsFound(queryResult);
            }
        });
    };

    var findOrganisation = function (queryResult) {
        Organisation.findOne(queryResult.args).lean().exec(function (err, organisation) {
            if(err || !organisation) {
                queryResult.err = err;
                noOrganisationsFound(queryResult);
            } else {
                queryResult.data = organisation;
                organisationsFound(queryResult);
            }
        });
    };

    var searchOrganisation = function (queryResult) {
        Organisation.find(queryResult.args).lean().exec(function (err, organisations) {
            if(err || !organisations) {
                queryResult.err = err;
                noOrganisationsFound(queryResult);
            } else {
                queryResult.data = organisations;
                organisationsFound(queryResult);
            }
        });
    };

    var noOrganisationsFound = function (queryResult) {
        queryResult.success = false;
        queryResult.message = 'No Organisation found';
        self.emit(eventType.noResult, queryResult);
        if(continueWith) {
            continueWith(null, queryResult);
        }
    };

    var organisationsFound = function (queryResult) {
        queryResult.success = true;
        queryResult.message = 'Organisation found';
        self.emit(eventType.result, queryResult);
        if(continueWith) {
            continueWith(null, queryResult);
        }
    };

    self.on(eventType.idQuery, findOrganisationById);
    self.on(eventType.displayNameQuery, findOrganisation);
    self.on(eventType.searchQuery, searchOrganisation);

    self.findOrganisationById = function (id, next) {
        continueWith = next;
        var queryResult = new QueryResult({id: id});
        self.emit(eventType.idQuery, queryResult);
    };

    self.findOrganisationByDisplayName = function (displayName, next) {
        continueWith = next;
        var queryResult = new QueryResult({displayName: displayName});
        self.emit(eventType.displayNameQuery, queryResult);
    };

    self.searchOrganisations = function (args, next) {
        continueWith = next;
        var queryResult = new QueryResult(args);
        self.emit(eventType.searchQuery, queryResult);
    };

    self.events = eventType;

    return self;
};

util.inherits(OrganisationQuery, Emitter);

module.exports = OrganisationQuery;
