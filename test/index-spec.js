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

var Membership = require('../index');

describe('Membership', function () {

    var membership = new Membership(mongoose);

    describe('registration', function () {
        var newUser = {};
        var newOrganisation = {};
        var displayName = 'user';
        var email = 'user@email.com';
        var password = 'somegreatpassword';
        var confirmPass = 'somegreatpassword';
        var organisationName = 'myOrg';
        before(function (done) {
            mockgoose.reset();
            membership.register({displayName: displayName, email: email, password: password, confirmPass: confirmPass, organisationName: organisationName}, function (err, result) {
                newUser = result.user;
                newOrganisation = result.organisation;
                assert.ok(result.success, 'error in registration');
                done(err);
            });
        });

        it('successfully registered', function (done) {
            done();
        });
    });

    describe('authentication', function () {
        var newUser = {};
        var displayName = 'user';
        var email = 'user@email.com';
        var password = 'somegreatpassword';
        var confirmPass = 'somegreatpassword';
        var organisationName = 'myOrg';
        before(function (done) {
            mockgoose.reset();
            membership.register({displayName: displayName, email: email, password: password, confirmPass: confirmPass, organisationName: organisationName}, function (err, result) {
                newUser = result.user;
                assert.ok(result.success, 'error in registration');
                done();
            });
        });

        it('successfully authenticates', function (done) {
            membership.authenticate(email, password, function (err, result) {
                result.success.should.equal(true);
                done(err);
            });
        });
    });

    describe('checking displayName', function () {
        var regResult = {};
        var displayName = 'name';
        var email = 'user@test.com';
        var password = 'pass';
        var confirmPass = 'pass';
        var organisationName = 'myOrg';

        var nonExistentUserName = 'someName';
        var nonExistentOrgName = 'someOrgName';

        before(function (done) {
            mockgoose.reset();
            membership.register({email: email, displayName: displayName,
                    password: password, confirmPass: confirmPass, organisationName: organisationName},
                function (err, result) {
                    assert.ok(result.success);
                    regResult = result;
                    done(err);
                });
        });

        after(function () {
            mockgoose.reset();
        });

        it('returns true when checking ' + displayName, function (done) {
            membership.checkDisplayNameExists(displayName, function (err, exists) {
                exists.should.equal(true);
                done(err);
            });
        });
        it('returns true when checking ' + organisationName, function (done) {
            membership.checkDisplayNameExists(organisationName, function (err, exists) {
                exists.should.equal(true);
                done(err);
            });
        });
        it('returns false when checking ' + nonExistentUserName, function (done) {
            membership.checkDisplayNameExists(nonExistentUserName, function (err, exists) {
                exists.should.equal(false);
                done(err);
            });
        });
        it('returns false when checking ' + nonExistentOrgName, function (done) {
            membership.checkDisplayNameExists(nonExistentOrgName, function (err, exists) {
                exists.should.equal(false);
                done(err);
            });
        });
    });

    describe('user queries', function () {
        var newUser = {};
        var displayName = 'user';
        var email = 'user@email.com';
        var password = 'somegreatpassword';
        var confirmPass = 'somegreatpassword';

        var organisationName = 'myOrg';

        var invalidDisplayName = 'invalid';
        var invalidId = ObjectId;
        var invalidEmail = 'invalid@email.com';

        before(function (done) {
            mockgoose.reset();
            membership.register({displayName: displayName, email: email, password: password, confirmPass: confirmPass, organisationName: organisationName}, function (err, result) {
                newUser = result.user;
                assert.ok(result.success, 'error in registration');
                done();
            });
        });

        it('finds a user with displayName ' + displayName, function (done) {
            membership.findUserByDisplayName(displayName, function (err, result) {
                var user = result.data;
                result.success.should.equal(true);
                should.exist(user);
                done(err);
            });
        });
        it('finds a user with id ' + newUser._id, function (done) {
            membership.findUserById(newUser._id, function (err, result) {
                var user = result.data;
                result.success.should.equal(true);
                should.exist(user);
                done(err);
            });
        });
        it('does not find a user with displayName ' + invalidDisplayName, function (done) {
            membership.findUserByDisplayName(invalidDisplayName, function (err, result) {
                result.success.should.equal(false);
                should.not.exist(result.data);
                result.message.should.equal('No User found');
                done(err);
            });
        });
        it('does not find a user with id ' + invalidId, function (done) {
            membership.findUserById(invalidId, function (err, result) {
                result.success.should.equal(false);
                should.not.exist(result.data);
                result.message.should.equal('No User found');
                done(err);
            });
        });
        it('does find a user with email ' + email, function (done) {
            membership.findUserByEmail(email, function (err, result) {
                var user = result.data;
                result.success.should.equal(true);
                should.exist(user);
                done(err);
            });
        });
        it('does not find a user with email ' + invalidEmail, function (done) {
            membership.findUserByEmail(invalidEmail, function (err, result) {
                result.success.should.equal(false);
                should.not.exist(result.data);
                result.message.should.equal('No User found');
                done(err);
            });
        });

        it('finds 1 user', function (done) {
            var searchText = "us";
            membership.searchUsers({displayName: new RegExp('^' + searchText, 'i')}, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(1);
                done(err);
            });
        });

        it('finds 0 users', function (done) {

            var username = 'dave';

            membership.searchUsers({ $or: [
                { email: username },
                { displayName: username }
            ] }, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(0);
                done(err);
            });
        });

        it('finds 1 user by email search', function (done) {
            var username = 'user@email.com';

            membership.searchUsers({ $or: [
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

    describe('team commands', function () {
        var name = 'aTeam';
        var organisation = ObjectId;

        var team = {};

        beforeEach(function (done) {
            mockgoose.reset();
            var testTeam = {name: name, organisation: organisation};
            membership.createTeam(testTeam, function (err, result) {
                result.success.should.equal(true);
                team = result.team;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('updates a team', function (done) {
            var newName = 'newName';
            team.name = newName;
            membership.updateTeam(team, function (err, result) {
                result.success.should.equal(true);
                result.team.name.should.equal(newName);
                result.team.organisation.should.eql(organisation);
                done(err);
            });
        });
        it('deletes a team', function (done) {
            membership.deleteTeam(team, function (err, result) {
                should.not.exist(err);
                result.success.should.equal(true);
                membership.findTeamById(team._id, function (err, result) {
                    result.success.should.equal(false);
                    should.not.exist(result.data);
                    done(err);
                });
            });
        });

    });

    describe('team queries', function () {
        var name = 'aTeam';
        var organisation = ObjectId;
        var invalidId = ObjectId;

        var team = {};

        before(function (done) {
            mockgoose.reset();
            var testTeam = {name: name, organisation: organisation};
            membership.createTeam(testTeam, function (err, result) {
                result.success.should.equal(true);
                team = result.team;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('finds a team with id ' + team._id, function (done) {
            membership.findTeamById(team._id, function (err, result) {
                var foundTeam = result.data;
                result.success.should.equal(true);
                should.exist(foundTeam);

                foundTeam._id.should.eql(team._id);
                foundTeam.organisation.should.eql(organisation);
                done(err);
            });
        });

        it('does not find a team with id ' + invalidId, function (done) {
            membership.findTeamById(invalidId, function (err, result) {
                var foundTeam = result.data;
                result.success.should.equal(false);
                should.not.exist(foundTeam);
                done(err);
            });
        });
    });

    describe('organisation commands', function () {
        var displayName = 'organisation';
        var owners = ObjectId;
        var billingEmail = 'org@company.com';

        var organisation = {};

        beforeEach(function (done) {
            mockgoose.reset();
            var testOrg = {owners: owners, displayName: displayName, billingEmail: billingEmail};
            membership.createOrganisation(testOrg, function (err, result) {
                result.success.should.equal(true);
                should.exist(result.organisation);
                organisation = result.organisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('successfully deletes an organisation', function (done) {
            membership.deleteOrganisation(organisation, function (err, result) {
                should.not.exist(err);
                result.success.should.equal(true);
                result.message.should.equal('Organisation deleted');
                membership.findOrganisationById(organisation._id, function (err, result) {
                    result.success.should.equal(false);
                    should.not.exist(result.organisation);
                    done(err);
                });
            });
        });

        it('gives and error when deleting an organisation that does not exist', function (done) {
            organisation._id = null;
            organisation.displayName = 'nonExistent';
            membership.deleteOrganisation(organisation, function (err, result) {
                console.log(result);
                result.success.should.equal(false);
                result.message.should.equal('Organisation not deleted');
                should.exist(result.err);
                should.not.exist(result.organisation);
                done(err);
            });
        });

        it('successfully updates an organisation with valid values', function (done) {
            var displayNameUpdated = 'organisation_updated';
            var billingEmailUpdated = 'updatedorg@test.com';
            var ownersUpdated = ObjectId;
            var titleUpdated = 'updated org name';
            var domainUpdated = 'updatedorg.domain.com';
            var emailUpdated = 'updatedorg@email.com';
            var photoUpdated = 'http:/photo/aphoto_updated';
            var formsUpdated = [ObjectId, ObjectId, ObjectId];
            var teamsUpdated = [ObjectId, ObjectId, ObjectId, ObjectId];

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

            membership.updateOrganisation(customOrg, function (err, result) {
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
            membership.updateOrganisation({_id: ObjectId, teams: [ObjectId, ObjectId]}, function (err, result) {
                (result.success).should.equal(false);
                should.not.exist(result.organisation);
                done(err);
            });
        });

    });

    describe('organisation queries', function () {
        var displayName = 'organisation';
        var owners = ObjectId;
        var billingEmail = 'org@company.com';
        var invalidDisplayName = 'invalid';
        var invalidId = ObjectId;

        var organisation = {};

        before(function (done) {
            mockgoose.reset();
            var testOrg = {owners: owners, displayName: displayName, billingEmail: billingEmail};
            membership.createOrganisation(testOrg, function (err, result) {
                organisation = result.organisation;
                done(err);
            });
        });

        after(function () {
            mockgoose.reset();
        });

        it('finds an organisation with displayName ' + displayName, function (done) {
            membership.findOrganisationByDisplayName(displayName, function (err, result) {
                var foundOrganisation = result.data;
                result.success.should.equal(true);
                should.exist(foundOrganisation);
                done(err);
            });
        });
        it('does not find an organisation with displayName ' + invalidDisplayName, function (done) {
            membership.findOrganisationByDisplayName(invalidDisplayName, function (err, result) {
                var foundOrganisation = result.data;
                result.success.should.equal(false);
                should.not.exist(foundOrganisation);
                done(err);
            });
        });
        it('finds an organisation with id ' + organisation._id, function (done) {
            membership.findOrganisationById(organisation._id, function (err, result) {
                var foundOrganisation = result.data;
                result.success.should.equal(true);
                should.exist(foundOrganisation);
                done(err);
            });
        });
        it('does not find an organisation with id ' + invalidId, function (done) {
            membership.findOrganisationById(invalidId, function (err, result) {
                var foundOrganisation = result.data;
                result.success.should.equal(false);
                should.not.exist(foundOrganisation);
                done(err);
            });
        });
        it('finds 1 organisation', function (done) {
            var searchText = "or";
            membership.searchOrganisations({displayName: new RegExp('^' + searchText, 'i')}, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(1);
                done(err);
            });
        });
        it('finds 1 organisation by displayName search', function (done) {
            var displayName = organisation.displayName;
            membership.searchOrganisations({ displayName: displayName }, function (err, result) {
                should.exist(result);
                result.success.should.equal(true);
                result.data.length.should.equal(1);
                done(err);
            });
        });
    });
});
