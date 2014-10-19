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

var Organisation = require('../models/organisation')(db);
var OrganisationCommand = require('../lib/organisationCommand');
var OrganisationQuery = require('../lib/organisationQuery');

var compareOrganisations = function (org1, org2) {
    org1._id.should.eql(org2._id);
    org1.displayName.should.equal(org2.displayName);
    org1.billingEmail.should.equal(org2.billingEmail);
    org1.owners.should.eql(org2.owners);
    org1.title.should.equal(org2.title);
    org1.orgDomain.should.equal(org2.orgDomain);
    org1.email.should.equal(org2.email);
    org1.photo.should.equal(org2.photo);
    org1.folders.length.should.equal(org2.folders.length);
    org1.teams.length.should.equal(org2.teams.length);
};


describe('Organisation Queries', function () {
    // Happy path
    describe('finding a single organisation', function () {

        var organisationCommand = new OrganisationCommand(Organisation);
        var organisationQuery = new OrganisationQuery(Organisation);

        var organisation = {};

        var displayName = 'organisation';
        var billingEmail = 'org@test.com';
        var owners = ObjectId;
        var members = ObjectId;
        var title = 'org name';
        var domain = 'org.orgDomain.com';
        var email = 'org@email.com';
        var photo = 'http:/photo/aphoto';
        var folders = [ObjectId, ObjectId];
        var teams = [ObjectId, ObjectId, ObjectId];

        var invalidDisplayName = 'invalid';
        var invalidId = ObjectId;

        before(function (done) {
            mockgoose.reset();
            var testOrganisation = new Organisation({
                displayName: displayName, billingEmail: billingEmail, owners: owners, title: title,
                orgDomain: domain, email: email, photo: photo, folders: folders, teams: teams, members: members
            });
            organisationCommand.createOrganisation(testOrganisation, function (err, result) {
                organisation = result.organisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('finds an organisation with displayName ' + displayName, function (done) {
            organisationQuery.findOrganisationByDisplayName(displayName, function (err, result) {
                var foundOrganisation = result.data;
                result.success.should.equal(true);
                should.exist(foundOrganisation);
                compareOrganisations(foundOrganisation, organisation);
                done(err);
            });
        });


        it('does not find an organisation with displayName ' + invalidDisplayName, function (done) {
            organisationQuery.findOrganisationByDisplayName(invalidDisplayName, function (err, result) {
                var foundOrganisation = result.data;
                result.success.should.equal(false);
                should.not.exist(foundOrganisation);
                done(err);
            });
        });

        it('finds an organisation with id ' + organisation._id, function (done) {
            organisationQuery.findOrganisationById(organisation._id, function (err, result) {
                var foundOrganisation = result.data;
                result.success.should.equal(true);
                should.exist(foundOrganisation);
                compareOrganisations(foundOrganisation, organisation);
                done(err);
            });
        });

        it('does not find an organisation with id ' + invalidId, function (done) {
            organisationQuery.findOrganisationById(invalidId, function (err, result) {
                var foundOrganisation = result.data;
                result.success.should.equal(false);
                should.not.exist(foundOrganisation);
                done(err);
            });
        });
    });

    describe('finding a list of organisations', function () {
        var organisationCommand = new OrganisationCommand(Organisation);
        var organisationQuery = new OrganisationQuery(Organisation);

        var organisation = {};

        var displayName = 'organisation';
        var billingEmail = 'org@test.com';
        var owners = ObjectId;
        var members = ObjectId;
        var title = 'org name';
        var domain = 'org.orgDomain.com';
        var email = 'org@email.com';
        var photo = 'http:/photo/aphoto';
        var folders = [ObjectId, ObjectId];
        var teams = [ObjectId, ObjectId, ObjectId];


        before(function (done) {
            mockgoose.reset();
            var testOrganisation = new Organisation({
                displayName: displayName, billingEmail: billingEmail, owners: owners, title: title,
                orgDomain: domain, email: email, photo: photo, folders: folders, teams: teams, members: members
            });
            organisationCommand.createOrganisation(testOrganisation, function (err, result) {
                organisation = result.organisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        var orgA = {};
        var orgB = {};
        var orgC = {};


        before(function (done) {
            mockgoose.reset();

            var testOrgA = {
                displayName: 'orgA',
                billingEmail: 'orgA@org.org',
                owners: ObjectId,
                members: ObjectId,
                title: 'Org A',
                orgDomain: 'domainA',
                email: 'emailA@email.com',
                photo: 'somephotourlA',
                folders: [ObjectId, ObjectId],
                teams: [ObjectId]
            };
            var testOrgB = {
                displayName: 'orgB',
                billingEmail: 'orgB@org.org',
                owners: ObjectId,
                members: ObjectId,
                title: 'Org B',
                orgDomain: 'domainB',
                email: 'emailB@email.com',
                photo: 'somephotourlB',
                folders: [ObjectId, ObjectId, ObjectId],
                teams: [ObjectId, ObjectId]
            };
            var testOrgC = {
                displayName: 'orgC',
                billingEmail: 'orgC@org.org',
                owners: ObjectId,
                members: ObjectId,
                title: 'Org C',
                orgDomain: 'domainC',
                email: 'emailC@email.com',
                photo: 'somephotourlC',
                folders: [],
                teams: [ObjectId]
            };

            organisationCommand.createOrganisation(testOrgA, function (err, result) {
                result.success.should.equal(true);
                orgA = result.organisation;
                if (err) {
                    return done(err);
                }
                organisationCommand.createOrganisation(testOrgB, function (err, result) {
                    result.success.should.equal(true);
                    orgB = result.organisation;
                    if (err) {
                        return done(err);
                    }
                    organisationCommand.createOrganisation(testOrgC, function (err, result) {
                        result.success.should.equal(true);
                        orgC = result.organisation;
                        return done(err);
                    });
                });

            });
        });

        after(function () {
            mockgoose.reset();
        });
        it('finds 3 organisations', function (done) {
            var searchText = "or";
            organisationQuery.searchOrganisations({displayName: new RegExp('^' + searchText, 'i')}, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(3);
                done(err);
            });
        });

        it('finds 1 organisation by displayName search', function (done) {

            var displayName = orgA.displayName;

            organisationQuery.searchOrganisations({ displayName: displayName }, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(1);
                compareOrganisations(result.data[0], orgA);
                done(err);
            });
        });

    });

});


