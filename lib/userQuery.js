"use strict";
var Emitter = require('events').EventEmitter;
var util = require('util');
var QueryResult = require('./queryResult');

var UserQuery = function (User) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;

    var eventType = {
        idQuery: 'id-query',
        displayNameQuery: 'display-name-query',
        emailQuery: 'email-query',
        searchQuery: 'search-query',
        noResult: 'no-result',
        result: 'result'
    };

    var findUserById = function (queryResult) {
        User.findById(queryResult.args.id).populate('organisations teams').lean().exec(function (err, user) {
           if(err || !user) {
               queryResult.err = err;
               noUsersFound(queryResult);
           } else {
               queryResult.data = user;
               usersFound(queryResult);
           }
        });
    };

    var findUser = function (queryResult) {
        User.findOne(queryResult.args).populate('organisations teams').lean().exec(function (err, user) {
            if(err || !user) {
                queryResult.err = err;
                noUsersFound(queryResult);
            } else {
                queryResult.data = user;
                usersFound(queryResult);
            }
        });
    };

    var searchUsers = function (queryResult) {
        User.find(queryResult.args).lean().populate('organisations teams').exec(function (err, users) {
            if(err || !users) {
                queryResult.err = err;
                noUsersFound(queryResult);
            } else {
                queryResult.data = users;
                usersFound(queryResult);
            }
        });
    };

    var noUsersFound = function (queryResult) {
        queryResult.success = false;
        queryResult.message = 'No User found';
        self.emit(eventType.noResult, queryResult);
        if(continueWith) {
            continueWith(null, queryResult);
        }
    };

    var usersFound = function (queryResult) {
        queryResult.success = true;
        self.emit(eventType.result, queryResult);
        if(continueWith) {
            continueWith(null, queryResult);
        }
    };

    self.on(eventType.idQuery, findUserById);
    self.on(eventType.displayNameQuery, findUser);
    self.on(eventType.emailQuery, findUser);
    self.on(eventType.searchQuery, searchUsers);

    self.findUserById = function (id, next) {
        continueWith = next;
        var queryResult = new QueryResult({id: id});
        self.emit(eventType.idQuery, queryResult);
    };

    self.findUserByDisplayName = function (displayName, next) {
        continueWith = next;
        var queryResult = new QueryResult({displayName: displayName});
        self.emit(eventType.displayNameQuery, queryResult);
    };

    self.findUserByEmail = function (email, next) {
        continueWith = next;
        var queryResult = new QueryResult({email: email});
        self.emit(eventType.emailQuery, queryResult);
    };

    self.searchUsers = function (args, next) {
        continueWith = next;
        var queryResult = new QueryResult(args);
        self.emit(eventType.searchQuery, queryResult);
    };

    self.events = eventType;

    return self;
};

util.inherits(UserQuery, Emitter);

module.exports = UserQuery;
