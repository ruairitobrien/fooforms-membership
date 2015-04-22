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
var InviteCommand = require('../lib/InviteCommand');
var InviteQuery = require('../lib/InviteQuery');


describe('Invite Queries', function () {

    after(function () {
        mockgoose.reset();
    });

    // Happy path
    describe('finding a single invite', function () {

        var inviteCommand = new InviteCommand(Invite);
        var inviteQuery = new InviteQuery(Invite);

        var invite = {};

        var invalidId = ObjectId;


        before(function (done) {
            mockgoose.reset();
            var testInvite = new Invite({organisation: ObjectId});
            inviteCommand.create(testInvite, function (err, result) {
                console.log(JSON.stringify(result, null, 4));
                invite = result.entity;
                done(err);
            });
        });


        it('finds an invite by id ', function (done) {
            inviteQuery.findById(invite._id, function (err, result) {
                done(err);
            });
        });

        it('does not find an invite with invalid id ' + invalidId, function (done) {
            inviteQuery.findById(invalidId, function (err, result) {
                result.success.should.equal(false);
                should.not.exist(result.data);
                done(err);
            });
        });

    });

});


