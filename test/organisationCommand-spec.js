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
var OrganisationCommand = require('../lib/organisationCommand');


describe('Organisation Commands', function () {
    // Happy path
    describe('create a Organisation with defaults', function () {

        var organisationCommand = new OrganisationCommand(Organisation);

        var displayName = 'organisation';
        var owners = ObjectId;
        var billingEmail = 'org@company.com';

        var organisation = {};

        before(function (done) {
            mockgoose.reset();
            var testOrg = {owners: owners, displayName: displayName, billingEmail: billingEmail};
            organisationCommand.createOrganisation(testOrg, function (err, result) {
                organisation = result.organisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });
        it('displayname is ' + displayName, function () {
            organisation.displayName.should.equal(displayName);
        });
        it('billing email is ' + billingEmail, function () {
            organisation.billingEmail.should.equal(billingEmail);
        });
        it('has one owner', function () {
            organisation.owners.should.eql(owners);
        });
        it('has no title', function () {
            should.not.exist(organisation.title);
        });

    });

    describe('creating Organisation with most values', function () {
        var organisationCommand = new OrganisationCommand(Organisation);
        var organisation = {};

        var displayName = 'organisation';
        var billingEmail = 'org@test.com';
        var owners = ObjectId;
        var title = 'org name';
        var domain = 'org.domain.com';
        var email = 'org@email.com';
        var photo = 'http:/photo/aphoto';
        var forms = [ObjectId, ObjectId];
        var teams = [ObjectId, ObjectId, ObjectId];

        before(function (done) {
            mockgoose.reset();
            var testOrganisation = new Organisation({
                displayName: displayName, billingEmail: billingEmail, owners: owners, title: title,
                domain: domain, email: email, photo: photo, forms: forms, teams: teams
            });
            organisationCommand.createOrganisation(testOrganisation, function (err, result) {
                organisation = result.organisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('has a photo', function () {
            organisation.photo.should.equal(photo);
        });
        it('has ' + forms.length + ' forms', function () {
            organisation.forms.length.should.equal(forms.length);
        });
        it('has ' + teams.length + ' teams', function () {
            organisation.teams.length.should.equal(teams.length);
        });

    });

    describe('deleting an Organisation', function () {
        var organisationCommand = new OrganisationCommand(Organisation);

        var displayName = 'organisation';
        var owners = ObjectId;
        var billingEmail = 'org@company.com';

        var organisation = {};

        var user = {};

        beforeEach(function (done) {
            mockgoose.reset();
            var testOrg = {owners: owners, displayName: displayName, billingEmail: billingEmail};
            organisationCommand.createOrganisation(testOrg, function (err, result) {
                organisation = result.organisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('successfully deletes an organisation', function (done) {
            organisationCommand.deleteOrganisation(organisation, function (err, result) {
                (result.success).should.equal(true);
                Organisation.findById(organisation._id, function (err, deletedOrganisation) {
                    should.not.exist(deletedOrganisation);
                    done(err);
                });
            });
        });

        it('successfully deletes an organisation by id', function (done) {
            organisationCommand.deleteOrganisation({_id: organisation._id}, function (err, result) {
                (result.success).should.equal(true);
                Organisation.findById(organisation._id, function (err, deletedOrganisation) {
                    should.not.exist(deletedOrganisation);
                    done(err);
                });
            });
        });

        it('gives and error when deleting an organisation that does not exist', function (done) {
            organisationCommand.deleteOrganisation({_id: ObjectId}, function (err, result) {
                (result.success).should.equal(false);
                should.exist(result.err);
                should.not.exist(result.organisation);
                done(err);
            });
        });

    });

    describe('updating an Organisation', function () {
        var organisationCommand = new OrganisationCommand(Organisation);
        var organisation = {};

        var displayName = 'organisation';
        var billingEmail = 'org@test.com';
        var owners = ObjectId;
        var title = 'org name';
        var domain = 'org.domain.com';
        var email = 'org@email.com';
        var photo = 'http:/photo/aphoto';
        var forms = [ObjectId, ObjectId];
        var teams = [ObjectId, ObjectId, ObjectId];

        var displayNameUpdated = 'organisation_updated';
        var billingEmailUpdated = 'updatedorg@test.com';
        var ownersUpdated = ObjectId;
        var titleUpdated = 'updated org name';
        var domainUpdated = 'updatedorg.domain.com';
        var emailUpdated = 'updatedorg@email.com';
        var photoUpdated = 'http:/photo/aphoto_updated';
        var formsUpdated = [ObjectId, ObjectId, ObjectId, ObjectId];
        var teamsUpdated = [ObjectId, ObjectId, ObjectId, ObjectId, ObjectId];

        beforeEach(function (done) {
            mockgoose.reset();
            var testOrganisation = new Organisation({
                displayName: displayName, billingEmail: billingEmail, owners: owners, title: title,
                domain: domain, email: email, photo: photo, forms: forms, teams: teams
            });
            organisationCommand.createOrganisation(testOrganisation, function (err, result) {
                organisation = result.organisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('successfully updates an organisation mongoose object with valid values', function (done) {
            organisation.displayName = displayNameUpdated;
            organisation.billingEmail = billingEmailUpdated;
            organisation.owners = ownersUpdated;
            organisation.title = titleUpdated;
            organisation.domain = domainUpdated;
            organisation.email = emailUpdated;
            organisation.photo = photoUpdated;
            organisation.forms = formsUpdated;
            organisation.teams = teamsUpdated;

            organisationCommand.updateOrganisation(organisation, function (err, result) {
                (result.success).should.equal(true);
                should.exist(result.organisation);
                result.organisation.displayName.should.equal(displayNameUpdated);
                result.organisation.billingEmail.should.equal(billingEmailUpdated);
                result.organisation.owners.should.eql(ownersUpdated);
                result.organisation.title.should.equal(titleUpdated);
                result.organisation.domain.should.equal(domainUpdated);
                result.organisation.email.should.equal(emailUpdated);
                result.organisation.photo.should.equal(photoUpdated);
                result.organisation.forms.length.should.equal(formsUpdated.length);
                result.organisation.teams.length.should.equal(teamsUpdated.length);
                done(err);
            });
        });

        it('successfully updates an organisation with valid values', function (done) {
            var customOrg = {
                _id: organisation._id,
                displayName: displayNameUpdated,
                billingEmail: billingEmailUpdated,
                owners: ownersUpdated,
                title: titleUpdated,
                domain: domainUpdated,
                email: emailUpdated,
                photo: photoUpdated,
                forms: formsUpdated,
                teams: teamsUpdated
            };

            organisationCommand.updateOrganisation(customOrg, function (err, result) {
                (result.success).should.equal(true);
                should.exist(result.organisation);
                result.organisation.displayName.should.equal(displayNameUpdated);
                result.organisation.billingEmail.should.equal(billingEmailUpdated);
                result.organisation.owners.should.eql(ownersUpdated);
                result.organisation.title.should.equal(titleUpdated);
                result.organisation.domain.should.equal(domainUpdated);
                result.organisation.email.should.equal(emailUpdated);
                result.organisation.photo.should.equal(photoUpdated);
                result.organisation.forms.length.should.equal(formsUpdated.length);
                result.organisation.teams.length.should.equal(teamsUpdated.length);
                done(err);
            });
        });

        it('fails to update an organisation that does not exist', function (done) {
            organisationCommand.updateOrganisation({teams: [ObjectId, ObjectId]}, function (err, result) {
                (result.success).should.equal(false);
                should.not.exist(result.organisation);
                done(err);
            });
        });

    });

});

