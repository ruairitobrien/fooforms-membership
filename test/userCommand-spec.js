/*jslint node: true */
/*global describe, it, before, beforeEach, after, afterEach */
'use strict';

var should = require('should');
var assert = require('assert');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId();

var mockgoose = require('mockgoose');
mockgoose(mongoose);
var db = mongoose.connection;

var User = require('../models/user')(db);
var UserCommand = require('../lib/userCommand');


describe('User Commands', function () {
    // Happy path
    describe('create a user with defaults', function () {

        var userCommand = new UserCommand(User);

        var email = 'user@test.com';
        var displayName = 'user';
        var password = 'somecrappass';
        var teams = [ObjectId];

        var user = {};


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

        it('displayname is ' + displayName, function () {
            user.displayName.should.equal(displayName);
        });
        it('emails is ' + email, function () {
            user.email.should.equal(email);
        });

        it('has no name', function () {
            user.name.should.have.properties('familyName', 'givenName', 'middleName');
            should.not.exist(user.displayName.familyName);
            should.not.exist(user.displayName.givenName);
            should.not.exist(user.displayName.middleName);
        });

        it('has a password', function () {
            user.password.should.equal(password);
        });
        it('has no photo', function () {
            should.not.exist(user.photo);
        });
        it('has a default local provider', function () {
            user.provider.should.equal('local');
        });
        it('has one team', function () {
            user.teams.length.should.equal(1);
        });
        it('has no forms', function () {
            user.forms.length.should.equal(0);
        });
        it('is not admin', function () {
            user.admin.should.equal(false);
        });
    });

    describe('creating User with most values', function () {
        var userCommand = new UserCommand(User);
        var user = {};

        var email = 'user@test.com';
        var displayName = 'user';
        var password = 'somecrappass';
        var teams = [ObjectId];
        var givenName = 'given';
        var middleName = 'middle';
        var familyName = 'family';
        var photo = 'someurl';

        before(function (done) {
            mockgoose.reset();
            var testUser = new User({name: {givenName: givenName, middleName: middleName, familyName: familyName},
                email: email, displayName: displayName, password: password, teams: teams,
                photo: photo});
            userCommand.createUser(testUser, function (err, result) {
                user = result.user;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('has a valid name', function () {
            user.name.givenName.should.equal(givenName);
            user.name.familyName.should.equal(familyName);
            user.name.middleName.should.equal(middleName);
        });
        it('has a photo', function () {
            user.photo.should.equal(photo);
        });

    });

    describe('initializing user with invalid password', function () {
        var userCommand = new UserCommand(User);
        var user = {};

        var email = 'user@test.com';
        var displayName = 'user';
        var teams = [ObjectId];

        beforeEach(function () {
            mockgoose.reset();
            user = new User({email: email, displayName: displayName, teams: teams});
        });

        after(function () {
            mockgoose.reset();
        });

        it('throws an error on save with invalid password message when no password provided', function (done) {
            userCommand.createUser({email: email, displayName: displayName, teams: teams}, function (err, result) {
                should.exist(result.err);
                should.not.exist(result.user);
                result.err.message.should.equal('Invalid password');
                done();
            });
        });
        it('throws an error on save with password cannot be blank message when empty password provided', function (done) {
            userCommand.createUser({email: email, displayName: displayName, teams: teams, password: ''}, function (err, result) {
                should.exist(result.err);
                should.not.exist(result.user);
                done();
            });
        });

    });

    describe('deleting a user', function () {
        var userCommand = new UserCommand(User);

        var email = 'user@test.com';
        var displayName = 'user';
        var password = 'somecrappass';
        var teams = [ObjectId];

        var user = {};


        beforeEach(function (done) {
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

        it('successfully deletes a user by id', function (done) {
            userCommand.deleteUser({id: user._id}, function (err, result) {
                (result.success).should.equal(true);
                User.findById(user._id, function (err, deletedUser) {
                    should.not.exist(deletedUser);
                    done(err);
                });
            });
        });

        it('successfully deletes a user by displayName', function (done) {
            userCommand.deleteUser({displayName: user.displayName}, function (err, result) {
                (result.success).should.equal(true);
                User.findById(user._id, function (err, deletedUser) {
                    should.not.exist(deletedUser);
                    done(err);
                });
            });
        });

        it('gives and error when deleting a user that does not exist', function (done) {
            userCommand.deleteUser({id: 'blabla'}, function (err, result) {
                (result.success).should.equal(false);
                should.exist(result.err);
                done(err);
            });
        });

    });

    describe('updating a user', function () {
        var userCommand = new UserCommand(User);

        var email = 'user@test.com';
        var displayName = 'user';
        var password = 'somecrappass';
        var teams = [ObjectId];

        var user = {};


        beforeEach(function (done) {
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

        it('successfully updates a user mongoose object', function (done) {
            user.teams = [ObjectId, ObjectId];
            userCommand.updateUser(user, function (err, result) {
                (result.success).should.equal(true);
                should.exist(result.user);
                result.user.teams.length.should.equal(2);
                done(err);
            });
        });

        it('successfully updates a user with valid values', function (done) {
            userCommand.updateUser({displayName: displayName, teams: [ObjectId, ObjectId]}, function (err, result) {
                (result.success).should.equal(true);
                should.exist(result.user);
                result.user.teams.length.should.equal(2);
                done(err);
            });
        });

        it('fails to update a user that does not exist', function (done) {
            userCommand.updateUser({teams: [ObjectId, ObjectId]}, function (err, result) {
                (result.success).should.equal(false);
                should.not.exist(result.user);
                done(err);
            });
        });

    });

});


