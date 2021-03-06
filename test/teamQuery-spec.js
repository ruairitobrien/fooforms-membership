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
var TeamCommand = require('../lib/teamCommand');
var TeamQuery = require('../lib/teamQuery');


describe('Team Queries', function () {
    // Happy path
    describe('finding a single team', function () {

        var teamCommand = new TeamCommand(Team);
        var teamQuery = new TeamQuery(Team);

        var team = {};

        var name = 'aTeam';
        var description = 'amazing team';
        var organisation = ObjectId;
        var members = [ObjectId, ObjectId, ObjectId];
        var folders = [ObjectId, ObjectId];
        var permissionLevel = 'write';

        var invalidId = ObjectId;


        before(function (done) {
            mockgoose.reset();
            var testTeam = new Team({displayName: name,
                description: description, organisation: organisation, members: members, folders: folders, permissionLevel: permissionLevel});
            teamCommand.createTeam(testTeam, function (err, result) {
                team = result.team;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('finds a team with id ' + team._id, function (done) {
            teamQuery.findTeamById(team._id, function (err, result) {
                var foundTeam = result.data;
                result.success.should.equal(true);
                should.exist(foundTeam);

                foundTeam._id.should.eql(team._id);
                foundTeam.organisation.should.eql(organisation);
                foundTeam.description.should.equal(description);
                foundTeam.members.length.should.equal(members.length);
                foundTeam.folders.length.should.equal(folders.length);
                done(err);
            });
        });

        it('does not find a team with id ' + invalidId, function (done) {
            teamQuery.findTeamById(invalidId, function (err, result) {
                var foundTeam = result.data;
                result.success.should.equal(false);
                should.not.exist(foundTeam);
                done(err);
            });
        });

    });

    describe('finding a list of teams', function () {

        var teamCommand = new TeamCommand(Team);
        var teamQuery = new TeamQuery(Team);


        var invalidId = 'an invalid id';
        var organisationId = ObjectId;

        before(function (done) {
            mockgoose.reset();

            var testTeamA = {
                displayName: 'teamA',
                organisation: organisationId
            };
            var testTeamB = {
                displayName: 'teamB',
                organisation: organisationId
            };
            var testTeamC = {
                displayName: 'teamC',
                organisation: organisationId
            };

            teamCommand.createTeam(testTeamA, function (err, result) {
                result.success.should.equal(true);
                if (err) {
                    return done(err);
                }
                teamCommand.createTeam(testTeamB, function (err, result) {
                    result.success.should.equal(true);
                    if (err) {
                        return done(err);
                    }
                    teamCommand.createTeam(testTeamC, function (err, result) {
                        result.success.should.equal(true);
                        return done(err);
                    });
                });

            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('finds 3 teams', function (done) {
            teamQuery.findTeamByOrganisation(organisationId, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(3);
                done(err);
            });
        });

        it('finds no teams', function (done) {
            teamQuery.findTeamByOrganisation({organisationId: invalidId}, function (err, result) {
                should.exist(result);
                result.success.should.equal(false);
                should.not.exist(result.data);
                done(err);
            });
        });
    });

});


