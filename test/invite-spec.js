'use strict';

var should = require('should');
var assert = require('assert');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId();

var mockgoose = require('mockgoose');
mockgoose(mongoose);
var db = mongoose.connection;

var Invite = require('../models/invite')(db);

describe('Invite', function () {

    after(function () {
        mockgoose.reset();
    });


    // Happy path
    describe('initialising invite with defaults', function () {
        var invite = {};

        var organisation = ObjectId;
        var inviter = ObjectId;


        before(function (done) {
            mockgoose.reset();
            var testInvite = new Invite({organisation: organisation, inviter: inviter});
            testInvite.save(function (err, savedInvite) {
                invite = savedInvite;
                done(err);
            });
        });

        it('organisation is ' + organisation, function () {
            invite.organisation.should.eql(organisation);
        });
        it('inviter is ' + inviter, function () {
            invite.inviter.should.eql(inviter);
        });
        it('has no email', function () {
            should.not.exist(invite.email);
        });
        it('has no message', function () {
            should.not.exist(invite.message);
        });
        it('has no status', function () {
            should.not.exist(invite.status);
        });
        it('has a created date', function () {
            invite.created.should.be.instanceof(Date);
            should.exist(invite.created);
        });
        it('has a last modified date', function () {
            invite.lastModified.should.be.instanceof(Date);
            should.exist(invite.lastModified);
        });
        it('has no expiration date', function () {
            should.not.exist(invite.expires);
        });
        it('is active', function () {
            invite.active.should.equal(true);
        });
        it('should have a times used of 0', function () {
            invite.timesUsed.should.equal(0);
        });
        it('should have a max times used of 0', function () {
            invite.maxTimesUsed.should.equal(0);
        });
        it('should have an invite type of Open', function () {
            invite.inviteType.should.equal('Open');
        })
    });

    describe('initializing a one off invite', function () {

        var invite = {};

        var organisation = ObjectId;
        var inviter = ObjectId;
        var email = 'test@email.com';
        var message = 'hello';
        var status = 'pending';
        var maxTimesUsed = 1;
        var inviteType = 'Single';

        before(function (done) {
            mockgoose.reset();
            var testInvite = new Invite({
                organisation: organisation,
                inviter: inviter,
                email: email,
                message: message,
                status: status,
                maxTimesUsed: maxTimesUsed,
                inviteType: inviteType
            });
            testInvite.save(function (err, savedInvite) {
                invite = savedInvite;
                done(err);
            });
        });

        it('organisation is ' + organisation, function () {
            invite.organisation.should.eql(organisation);
        });
        it('inviter is ' + inviter, function () {
            invite.inviter.should.eql(inviter);
        });
        it('email is ' + email, function () {
            invite.email.should.equal(email);
        });
        it('message is ' + message, function () {
            invite.message.should.equal(message);
        });
        it('status is ' + status, function () {
            invite.status.should.equal(status);
        });
        it('has a created date', function () {
            invite.created.should.be.instanceof(Date);
            should.exist(invite.created);
        });
        it('has a last modified date', function () {
            invite.lastModified.should.be.instanceof(Date);
            should.exist(invite.lastModified);
        });
        it('has no expiration date', function () {
            should.not.exist(invite.expires);
        });
        it('is active', function () {
            invite.active.should.equal(true);
        });
        it('should have a times used of 0', function () {
            invite.timesUsed.should.equal(0);
        });
        it('should have a max times used of 1', function () {
            invite.maxTimesUsed.should.equal(1);
        });
        it('should have an inviteType of Single', function () {
            invite.inviteType.should.equal('Single');
        });
    });

    describe('errors when creating an invalid single invite', function () {
        var organisation = ObjectId;
        var inviter = ObjectId;
        var email = 'test@email.com';
        var message = 'hello';
        var status = 'pending';
        var maxTimesUsed = 1;
        var inviteType = 'Single';

        before(function () {
            mockgoose.reset();
        });

        it('should give an error when a single invite is created with no email', function (done) {
            var invite = new Invite({
                organisation: organisation,
                inviter: inviter,
                message: message,
                status: status,
                maxTimesUsed: maxTimesUsed,
                inviteType: inviteType
            });

            invite.save(function (err, savedInvite) {
                should.not.exist(savedInvite);
                should.exist(err);
                err.message.should.equal('An email must be provided for a Single invite');
                done();
            });
        });

        it('should give an error when a single invite is created with max times used not equal to 1', function (done) {
            var invite = new Invite({
                organisation: organisation,
                inviter: inviter,
                email: email,
                message: message,
                status: status,
                maxTimesUsed: 0,
                inviteType: inviteType
            });

            invite.save(function (err, savedInvite) {
                should.not.exist(savedInvite);
                err.message.should.equal('A single invite must have a max times used of 1');
                done();
            });
        });

    });
});