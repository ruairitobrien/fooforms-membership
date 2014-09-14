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

var Team = require('../models/team')(mongoose);
var TeamCommand = require('../lib/teamCommand');


describe('Team Commands', function () {
    // Happy path
    describe('create a team with defaults', function () {

        var teamCommand = new TeamCommand(Team);

        var name = 'aTeam';
        var organisation = ObjectId;

        var team = {};


        before(function (done) {
            mockgoose.reset();
            var testTeam = {name: name, organisation: organisation};
            teamCommand.createTeam(testTeam, function (err, result) {
                team = result.team;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('name is ' + name, function () {
            team.name.should.equal(name);
        });
        it('has no forms', function () {
            team.forms.length.should.equal(0);
        });
        it('has no members', function () {
            team.members.length.should.equal(0);
        });
        it('permission level is read', function () {
           team.permissionLevel.should.equal('read');
        });
        it('has no description', function () {
           should.not.exist(team.description);
        });

    });

    describe('creating Team with most values', function () {
        var teamCommand = new TeamCommand(Team);
        var team = {};

        var name = 'aTeam';
        var description = 'amazing team';
        var organisation = ObjectId;
        var members = [ObjectId, ObjectId, ObjectId];
        var forms = [ObjectId, ObjectId];
        var permissionLevel = 'write';


        before(function (done) {
            mockgoose.reset();
            var testTeam = new Team({name: name,
                description: description, organisation: organisation, members: members, forms: forms, permissionLevel: permissionLevel});
            teamCommand.createTeam(testTeam, function (err, result) {
                team = result.team;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('has the name ' + name, function () {
            team.name.should.equal(name);
        });
        it('has the description ' + description, function () {
            team.description.should.equal(description);
        });
        it('has the permission level ' + permissionLevel, function () {
            team.permissionLevel.should.equal(permissionLevel);
        });

    });

    describe('initializing team with no name', function () {
        var team = {};
        var organisation = ObjectId;

        beforeEach(function () {
            mockgoose.reset();
            team = new Team({name: null, organisation: organisation});
        });

        after(function () {
            mockgoose.reset();
        });

        it('throws an error on save when no name provided', function (done) {
            team.save(function (err, savedTeam) {
                should.exist(err);
                should.not.exist(savedTeam);
                done();
            });
        });

    });

    describe('deleting a team', function () {
        var teamCommand = new TeamCommand(Team);
        var team = {};

        var name = 'aTeam';
        var description = 'amazing team';
        var organisation = ObjectId;
        var members = [ObjectId, ObjectId, ObjectId];
        var forms = [ObjectId, ObjectId];
        var permissionLevel = 'write';


        before(function (done) {
            mockgoose.reset();
            var testTeam = new Team({name: name,
                description: description, organisation: organisation, members: members, forms: forms, permissionLevel: permissionLevel});
            teamCommand.createTeam(testTeam, function (err, result) {
                team = result.team;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });


        it('successfully deletes a team by id', function (done) {
            teamCommand.deleteTeam({id: team._id}, function (err, result) {
                (result.success).should.equal(true);
                Team.findById(team._id, function (err, deletedTeam) {
                    should.not.exist(deletedTeam);
                    done(err);
                });
            });
        });

        it('gives and error when deleting a team that does not exist', function (done) {
            teamCommand.deleteTeam({id: 'blabla'}, function (err, result) {
                (result.success).should.equal(false);
                should.exist(result.err);
                done(err);
            });
        });

    });

    describe('updating a team', function () {
        var teamCommand = new TeamCommand(Team);
        var team = {};
        var name = 'aTeam';
        var description = 'amazing team';
        var organisation = ObjectId;
        var members = [ObjectId, ObjectId, ObjectId];
        var forms = [ObjectId, ObjectId];
        var permissionLevel = 'write';

        beforeEach(function (done) {
            mockgoose.reset();
            var testTeam = new Team({name: name,
                description: description, organisation: organisation, members: members, forms: forms, permissionLevel: permissionLevel});
            teamCommand.createTeam(testTeam, function (err, result) {
                team = result.team;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('successfully updates a team mongoose object with valid values', function (done) {
            team.permissionLevel = 'read';
            teamCommand.updateTeam(team, function (err, result) {
                (result.success).should.equal(true);
                should.exist(result.team);
                result.team.name.should.equal(name);
                result.team.permissionLevel.should.equal('read');
                done(err);
            });
        });

        it('successfully updates a team with valid values', function (done) {
            teamCommand.updateTeam({_id: team._id, permissionLevel: 'read'}, function (err, result) {
                (result.success).should.equal(true);
                should.exist(result.team);
                result.team.name.should.equal(name);
                result.team.permissionLevel.should.equal('read');
                done(err);
            });
        });

        it('fails to update a team that does not exist', function (done) {
            team._id = ObjectId;
            teamCommand.updateTeam(team, function (err, result) {
                (result.success).should.equal(false);
                should.not.exist(result.team);
                done(err);
            });
        });

    });

});


