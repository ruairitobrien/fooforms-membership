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

var Invite = require('../models/invite')(db);
var InviteCommand = require('../lib/inviteCommand');


describe('Invite Commands', function () {

    var inviteCommand;

    before(function () {
        inviteCommand = new InviteCommand(Invite);
    });

    after(function () {
        mockgoose.reset();
    });

    // Happy path
    describe('create an Invite with defaults', function () {
        var organisation = ObjectId;
        var invite = {};

        before(function (done) {
            mockgoose.reset();
            var testInvite = {organisation: organisation};
            inviteCommand.create(testInvite, function (err, result) {
                invite = result.entity;
                done(err);
            });
        });

        it('organisation is ' + organisation, function () {
            invite.organisation.should.eql(organisation);
        });
        it('has no inviter ', function () {
            should.not.exist(invite.inviter);
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

    describe('creating Invite with most values', function () {
        var invite = {};

        var organisation = ObjectId;
        var inviter = ObjectId;
        var email = 'test@email.com';
        var message = 'test message';
        var status = 'pending';
        var expires = new Date();
        var active = false;
        var timesUsed = 1;
        var maxTimesUsed = 1;
        var inviteType = 'Single';

        before(function (done) {
            mockgoose.reset();
            var testInvite = {
                organisation: organisation,
                inviter: inviter,
                email: email,
                message: message,
                status: status,
                expires: expires,
                active: active,
                timesUsed: timesUsed,
                maxTimesUsed: maxTimesUsed,
                inviteType: inviteType
            };
            inviteCommand.create(testInvite, function (err, result) {
                invite = result.entity;
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
        it('expiration date is ' + expires, function () {
            invite.expires.should.equal(expires);
        });
        it('is not active', function () {
            invite.active.should.equal(false);
        });
        it('should have a times used of ' + timesUsed, function () {
            invite.timesUsed.should.equal(timesUsed);
        });
        it('should have a max times used of ' + maxTimesUsed, function () {
            invite.maxTimesUsed.should.equal(maxTimesUsed);
        });
        it('should have an invite type of ' + inviteType, function () {
            invite.inviteType.should.equal(inviteType);
        })

    });

    describe('initializing an invite with no organisation', function () {
        var invite = {};

        beforeEach(function () {
            mockgoose.reset();
        });

        it('throws an error on save when no organisation provided', function (done) {
            inviteCommand.create(invite, function (err, result) {
                should.exist(err);

                done();
            });
        });

    });

    describe('deleting an invite', function () {
        var inviteCommand = new InviteCommand(Invite);
        var invite = {};

        var organisation = ObjectId;


        before(function (done) {
            mockgoose.reset();
            var testInvite = {
                organisation: organisation
            };
            inviteCommand.create(testInvite, function (err, result) {
                invite = result.entity;
                done(err);
            });
        });

        it('successfully deletes an invite by id', function (done) {
            inviteCommand.remove({id: invite._id}, function (err, result) {
                (result.success).should.equal(true);
                Invite.findById(invite._id, function (err, doc) {
                    should.not.exist(doc);
                    done(err);
                });
            });
        });

        it('gives and error when deleting an invite that does not exist', function (done) {
            inviteCommand.remove({id: 'blabla'}, function (err, result) {
                (result.success).should.equal(false);
                should.exist(result.err);
                done(err);
            });
        });

    });


    describe('updating an invite', function () {
        var invite = {};
        var organisation = ObjectId;
        var message = 'hello';

        beforeEach(function (done) {
            mockgoose.reset();
            var testInvite = new Invite({
                organisation: organisation
            });
            inviteCommand.create(testInvite, function (err, result) {
                invite = result.entity;
                done(err);
            });
        });

        it('successfully updates an invite mongoose object with valid values', function (done) {
            invite.message = message;
            inviteCommand.update(invite, function (err, result) {
                (result.success).should.equal(true);
                should.exist(result.entity);
                result.entity._id.should.eql(invite._id);
                result.entity.message.should.equal(message);
                done(err);
            });
        });

        it('successfully updates an invite with valid values', function (done) {
            inviteCommand.update({
                _id: invite._id,
                message: message
            }, function (err, result) {
                (result.success).should.equal(true);
                should.exist(result.entity);
                result.entity._id.should.eql(invite._id);
                result.entity.message.should.equal(message);
                done(err);
            });
        });

        it('fails to update an invite that does not exist', function (done) {
            inviteCommand.update({_id: ObjectId, message: message}, function (err, result) {
                (result.success).should.equal(false);
                should.not.exist(result.entity);
                done(err);
            });
        });

    });

    describe('creating a one off invite', function () {
        it('is successful when correct values provided', function (done) {
            var organisation = ObjectId;
            var inviter = ObjectId;
            var email = 'test@email.com';

            var invite = {inviter: inviter, email: email, organisation: organisation};

            inviteCommand.createOneOffInvite(invite, function (err, result) {
                should.not.exist(err);
                var invite = result.entity;

                invite.inviter.should.eql(inviter);
                invite.email.should.equal(email);
                invite.organisation.should.eql(organisation);
                invite.status.should.equal('pending');
                invite.status.should.equal('pending');
                invite.maxTimesUsed.should.equal(1);
                invite.inviteType.should.equal('Single');
                (result.success).should.equal(true);
                should.not.exist(result.err);

                done(err);
            });

        });

        it('fails if organisation is not provided', function (done) {
            var inviter = ObjectId;
            var email = 'test@email.com';

            var invite = {inviter: inviter, email: email};

            inviteCommand.createOneOffInvite(invite, function (err, result) {
                result.success.should.equal(false);
                should.exist(err);
                err.message.should.equal('Organisation ID is required. ');
                done();
            });
        });

        it('fails if inviter is not provided', function (done) {
            var organisation = ObjectId;
            var email = 'test@email.com';

            var invite = {organisation: organisation, email: email};

            inviteCommand.createOneOffInvite(invite, function (err, result) {
                result.success.should.equal(false);
                should.exist(err);
                err.message.should.equal('Inviter is required. ');
                done();
            });
        });

        it('fails if email is not provided', function (done) {
            var invite = {organisation: ObjectId, inviter: ObjectId};

            inviteCommand.createOneOffInvite(invite, function (err, result) {
                result.success.should.equal(false);
                should.exist(err);
                err.message.should.equal('Email is required and must be a valid email. ');
                done();
            });
        });
        it('fails if organisation is not a valid mongo id', function (done) {
            var organisation = 'blaaaaa';
            var inviter = ObjectId;
            var email = 'test@email.com';

            var invite = {inviter: inviter, email: email, organisation: organisation};

            inviteCommand.createOneOffInvite(invite, function (err, result) {
                result.success.should.equal(false);
                should.exist(err);
                err.message.should.equal('Organisation ID is required. ');
                done();
            });
        });

        it('fails if inviter is not a valid mongo id', function (done) {
            var organisation = ObjectId;
            var inviter = 'iminvalid';
            var email = 'test@email.com';

            var invite = {inviter: inviter, email: email, organisation: organisation};

            inviteCommand.createOneOffInvite(invite, function (err, result) {
                result.success.should.equal(false);
                should.exist(err);
                err.message.should.equal('Inviter is required. ');
                done();
            });
        });

        it('fails if email is not valid', function (done) {
            var organisation = ObjectId;
            var inviter = ObjectId;
            var email = 'test@emailcom';

            var invite = {inviter: inviter, email: email, organisation: organisation};

            inviteCommand.createOneOffInvite(invite, function (err, result) {
                result.success.should.equal(false);
                should.exist(err);
                err.message.should.equal('Email is required and must be a valid email. ');
                done();
            });
        });
    });

});


