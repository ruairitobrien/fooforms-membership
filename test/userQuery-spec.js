/*jslint node: true */
/*global describe, it, before, beforeEach, after, afterEach */
'use strict';

var should = require('should');
var assert = require('assert');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId();
// Nasty hack for testing with mocha -w ... see: https://github.com/LearnBoost/mongoose/issues/1251
mongoose.models = {};
mongoose.modelSchemas = {};

var mockgoose = require('mockgoose');
mockgoose(mongoose);

var Organisation = require('../models/organisation')(mongoose);
var Team = require('../models/team')(mongoose);
var User = require('../models/user')(mongoose);
var UserCommand = require('../lib/userCommand');
var UserQuery = require('../lib/userQuery');



describe('User Queries', function () {
    // Happy path
    describe('finding a single user', function () {

        var userCommand = new UserCommand(User);
        var userQuery = new UserQuery(User);

        var user = {};
        var email = 'user@test.com';
        var displayName = 'user';
        var password = 'somecrappass';
        var teams = [ObjectId];


        var invalidId = 'an invalid id';
        var invalidEmail = 'aninvalid@email';
        var invalidDisplayName = 'invalid name';

        before(function (done) {
            mockgoose.reset();
            var testUser = {email: email, displayName: displayName,
                password: password, teams: teams};
            userCommand.createUser(testUser, function (err, result) {
                user = result.user;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('finds a user with displayName ' + displayName, function (done) {
            userQuery.findUserByDisplayName(displayName, function (err, result) {
                var foundUser = result.data;
                result.success.should.equal(true);
                should.exist(foundUser);

                foundUser._id.should.eql(user._id);
                foundUser.email.should.equal(email);
                foundUser.displayName.should.equal(displayName);
                foundUser.password.should.equal(password);
                done(err);
            });
        });

        it('does not find a user with displayName ' + invalidDisplayName, function (done) {
            userQuery.findUserByDisplayName(invalidDisplayName, function (err, result) {
                var foundUser = result.data;
                result.success.should.equal(false);
                should.not.exist(foundUser);
                done(err);
            });
        });

        it('finds a user with email ' + email, function (done) {
            userQuery.findUserByEmail(email, function (err, result) {
                var foundUser = result.data;
                result.success.should.equal(true);
                should.exist(foundUser);

                foundUser._id.should.eql(user._id);
                foundUser.email.should.equal(email);
                foundUser.displayName.should.equal(displayName);
                foundUser.password.should.equal(password);
                done(err);
            });
        });

        it('does not find a user with email ' + invalidEmail, function (done) {
            userQuery.findUserByEmail(invalidEmail, function (err, result) {
                var foundUser = result.data;
                result.success.should.equal(false);
                should.not.exist(foundUser);
                done(err);
            });
        });

        it('finds a user with id ' + user._id, function (done) {
            userQuery.findUserById(user._id, function (err, result) {
                var foundUser = result.data;
                result.success.should.equal(true);
                should.exist(foundUser);

                foundUser._id.should.eql(user._id);
                foundUser.email.should.equal(email);
                foundUser.displayName.should.equal(displayName);
                foundUser.password.should.equal(password);
                done(err);
            });
        });

        it('does not find a user with id ' + invalidId, function (done) {
            userQuery.findUserById(invalidId, function (err, result) {
                var foundUser = result.data;
                result.success.should.equal(false);
                should.not.exist(foundUser);
                done(err);
            });
        });
    });

    describe('searching users', function () {
        var userCommand = new UserCommand(User);
        var userQuery = new UserQuery(User);

        var userA = {};
        var userB = {};
        var userC = {};

        before(function (done) {
            mockgoose.reset();

            var testUserA = {
                email: 'usera@email.com',
                displayName: 'userA',
                password: 'userAPass',
                teams: [ObjectId, ObjectId]
            };
            var testUserB = {
                email: 'userb@email.com',
                displayName: 'userB',
                password: 'userBPass',
                teams: [ObjectId, ObjectId, ObjectId]
            };
            var testUserC = {
                email: 'userc@email.com',
                displayName: 'userC',
                password: 'userCPass',
                teams: [ObjectId]
            };

            userCommand.createUser(testUserA, function (err, result) {
                result.success.should.equal(true);
                if (err) {
                    return done(err);
                }
                userCommand.createUser(testUserB, function (err, result) {
                    result.success.should.equal(true);
                    if (err) {
                        return done(err);
                    }
                    userCommand.createUser(testUserC, function (err, result) {
                        result.success.should.equal(true);
                        return done(err);
                    });
                });

            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('finds 3 users', function (done) {
            var searchText = "us";
           userQuery.searchUsers({displayName: new RegExp('^' + searchText, 'i')}, function (err, result) {
               should.exist(result);
               result.success.should.equal(true);
               result.data.length.should.equal(3);
               done(err);
           });
        });

        it('finds 1 user by username search', function (done) {

            var username = 'userA';

            userQuery.searchUsers({ $or: [
                { email: username },
                { displayName: username }
            ] }, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(1);
                done(err);
            });
        });

        it('finds 1 user by email search', function (done) {
            var username = 'userb@email.com';

            userQuery.searchUsers({ $or: [
                { email: username },
                { displayName: username }
            ] }, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(1);
                done(err);
            });
        });
    });

});


