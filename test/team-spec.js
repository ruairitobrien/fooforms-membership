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

var Team = require('../models/team')(db);

describe('Team', function () {
    // Happy path
    describe('initialising a team with default value', function () {
        var team = {};

        var name = 'team';
        var organisation = ObjectId;

        before(function (done) {
            mockgoose.reset();
            var testTeam = new Team({displayName: name, organisation: organisation});
            testTeam.save(function (err, savedTeam) {
                team = savedTeam;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('displayName is ' + name, function () {
           team.displayName.should.equal(name);
        });
        it('has no description', function () {
            should.not.exist(team.description);
        });
        it('has no members', function () {
            team.members.length.should.equal(0);
        });
        it('has no folders', function () {
           team.folders.length.should.equal(0);
        });
        it('has default permission level of read', function () {
            team.permissionLevel.should.equal('read');
        });
        it('has a created date', function () {
            team.created.should.be.instanceof(Date);
            should.exist(team.created);
        });
        it('has a last modified date', function () {
            team.lastModified.should.be.instanceof(Date);
            should.exist(team.lastModified);
        });

    });

    describe('initialising a team with some realistic values', function () {
        var team = {};

        var name = 'team';
        var title = 'Team';
        var description = 'cool team';
        var organisation = ObjectId;
        var members = [ObjectId];
        var folders = [ObjectId];
        var permissionLevel = 'write';

        before(function (done) {
            mockgoose.reset();
            var testTeam = new Team({displayName: name, title: title, description: description, organisation: organisation,
                members: members, folders: folders, permissionLevel: permissionLevel});
            testTeam.save(function (err, savedTeam) {
                team = savedTeam;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('displayName is ' + name, function () {
            team.displayName.should.equal(name);
        });
        it('title is ' + title, function () {
            team.title.should.equal(title);
        });
        it('description is' + description, function () {
            team.description.should.equal(description);
        });
        it('has ' + members.length + ' members', function () {
           team.members.length.should.equal(members.length);
        });
        it('has ' + folders.length + ' folders', function () {
           team.folders.length.should.equal(folders.length);
        });
        it('has permission level of ' + permissionLevel, function () {
           team.permissionLevel.should.equal(permissionLevel);
        });
    });

    describe('initializing with no displayName', function () {
        var team = {};
        var organisation = ObjectId;

        before(function () {
            mockgoose.reset();
            team = new Team({organisation: organisation});
        });

        after(function () {
            mockgoose.reset();
        });

        it('does not save and gives an error', function (done) {
            team.save(function (err, savedTeam) {
                should.exist(err);
                should.not.exist(savedTeam);
                err.errors.displayName.path.should.equal('displayName');
                err.errors.displayName.type.should.equal('required');
                done();
            });
        });
    });

    describe('initializing with invalid permission level', function () {
        var team = {};

        var name = 'team';
        var organisation = ObjectId;
        var permissionLevel = 'bad';

        before(function () {
            mockgoose.reset();
            team = new Team({displayName: name, organisation: organisation, permissionLevel: permissionLevel});
        });

        after(function () {
            mockgoose.reset();
        });

        it('does not save and gives an error', function (done) {
            team.save(function (err, savedTeam) {
                should.exist(err);
                should.not.exist(savedTeam);
                err.errors.permissionLevel.message.should.equal(permissionLevel + ' is an invalid permission level');
                done();
            });
        });
    });

});
