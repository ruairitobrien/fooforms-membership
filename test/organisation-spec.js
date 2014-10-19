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

describe('Organisation', function () {
    // Happy path
    describe('initialising organisation with defaults', function () {
        var organisation = {};

        var displayName = 'organisation';
        var billingEmail = 'org@test.com';
        var owners = ObjectId;
        var members = ObjectId;


        before(function (done) {
            mockgoose.reset();
            var testOrganisation = new Organisation({displayName: displayName,
                billingEmail: billingEmail, owners: owners, members: members});
            testOrganisation.save(function (err, savedOrganisation) {
                organisation = savedOrganisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('displayName is ' + displayName, function () {
            organisation.displayName.should.equal(displayName);
        });
        it('billing email is ' + billingEmail, function () {
            organisation.billingEmail.should.equal(billingEmail);
        });
        it('has owners', function () {
            should.exist(organisation.owners);
            organisation.owners.should.eql(owners);
        });
        it('has members', function () {
            should.exist(organisation.members);
            organisation.members.should.eql(members);
        });
        it('has a created date', function () {
            organisation.created.should.be.instanceof(Date);
            should.exist(organisation.created);
        });
        it('has a last modified date', function () {
            organisation.lastModified.should.be.instanceof(Date);
            should.exist(organisation.lastModified);
        });
        it('has no title', function () {
            should.not.exist(organisation.title);
        });
        it('has no orgDomain', function () {
            should.not.exist(organisation.orgDomain);
        });
        it('has no email', function () {
            should.not.exist(organisation.email);
        });
        it('has no photo', function () {
            should.not.exist(organisation.photo);
        });
        it('has no folders', function () {
            organisation.folders.length.should.equal(0);
        });
        it('has no teams', function () {
            organisation.teams.length.should.equal(0);
        });
    });

    describe('initialising organisation with some realistic values', function () {
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
            var testOrganisation = new Organisation({displayName: displayName,
                billingEmail: billingEmail, owners: owners, title: title,
                orgDomain: domain, email: email, photo: photo, folders: folders,
                teams: teams, members: members});
            testOrganisation.save(function (err, savedOrganisation) {
                organisation = savedOrganisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('displayName is ' + displayName, function () {
            organisation.displayName.should.equal(displayName);
        });
        it('billing email is ' + billingEmail, function () {
            organisation.billingEmail.should.equal(billingEmail);
        });
        it('has owners', function () {
            should.exist(organisation.owners);
        });
        it('has a created date', function () {
            organisation.created.should.be.instanceof(Date);
            should.exist(organisation.created);
        });
        it('has a last modified date', function () {
            organisation.lastModified.should.be.instanceof(Date);
            should.exist(organisation.lastModified);
        });
        it('has the  title: ' + title, function () {
            organisation.title.should.equal(title);
        });
        it('has the orgDomain: ' + domain, function () {
            organisation.orgDomain.should.equal(domain);
        });
        it('has the email: ' + email, function () {
            organisation.email.should.equal(email);
        });
        it('has the photo: ' + photo, function () {
            organisation.photo.should.equal(photo);
        });
        it('has ' + folders.length + ' folders', function () {
            organisation.folders.length.should.equal(folders.length);
        });
        it('has ' + teams.length + ' teams', function () {
            organisation.teams.length.should.equal(teams.length);
        });
    });

    describe('initialising organisation with no owners', function () {
        var organisation = {};

        var displayName = 'organisation';
        var billingEmail = 'org@test.com';


        before(function () {
            mockgoose.reset();
            organisation = new Organisation({displayName: displayName,
                billingEmail: billingEmail});
        });

        after(function () {
            mockgoose.reset();
        });

        it('should not save and returns an error', function (done) {
            organisation.save(function (err, savedOrganisation) {
                should.exist(err);
                should.not.exist(savedOrganisation);
                err.errors.owners.path.should.equal('owners');
                err.errors.owners.type.should.equal('required');
                done();
            });
        });
    });

    describe('initialising organisation with no displayName', function () {
        var organisation = {};

        var billingEmail = 'org@test.com';
        var owners = [ObjectId];

        before(function () {
            mockgoose.reset();
            organisation = new Organisation({owners: owners,
                billingEmail: billingEmail});
        });

        after(function () {
            mockgoose.reset();
        });

        it('should not save and returns an error', function (done) {
            organisation.save(function (err, savedOrganisation) {
                should.exist(err);
                should.not.exist(savedOrganisation);
                err.errors.displayName.path.should.equal('displayName');
                err.errors.displayName.type.should.equal('required');
                done();
            });
        });
    });

    describe('initialising organisation with no billing email', function () {
        var organisation = {};

        var displayName = 'organisation';
        var owners = [ObjectId];

        before(function () {
            mockgoose.reset();
            organisation = new Organisation({owners: owners,
                displayName: displayName});
        });

        after(function () {
            mockgoose.reset();
        });

        it('should not save and returns an error', function (done) {
            organisation.save(function (err, savedOrganisation) {
                should.exist(err);
                should.not.exist(savedOrganisation);
                err.errors.billingEmail.path.should.equal('billingEmail');
                err.errors.billingEmail.type.should.equal('required');
                done();
            });
        });
    });
});
