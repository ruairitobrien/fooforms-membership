'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var inviteTypes = {
    values: 'Single Open'.split(' '),
    message: '`{PATH}` must be Single or Open but was `{VALUE}`'
};

var inviteSchema = new Schema({
    organisation: {
        type: Schema.Types.ObjectId,
        ref: 'Organisation',
        required: true
    },
    inviter: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    email: String,
    message: String,
    status: String,
    created: Date,
    lastModified: Date,
    // An expiration date can be set on an invite after which it can no longer be used
    expires: Date,
    // Open invites can be disabled using this value
    active: {
        type: Boolean,
        default: true
    },
    // Keep track of how many people were signed using this invite
    timesUsed: {
        type: Number,
        default: 0
    },
    // Optionally set a maximum number of times this invite can be used
    maxTimesUsed: {
        type: Number,
        default: 0
    },
    // The type of invite. Single is an invite specifically for one email. Open means it can be used multiple times.
    inviteType: {
        type: String,
        default: 'Open',
        enum: inviteTypes
    }
});

inviteSchema.pre('validate', function (next) {
    var err;
    if (this.inviteType === 'Single') {
        if (!this.email || !(this.email.length > 1)) {
            err = new Error('An email must be provided for a Single invite');
        }
        if (this.maxTimesUsed !== 1) {
            err = new Error('A single invite must have a max times used of 1');
        }
    } else if (this.inviteType === 'Open') {
        // TODO: what to validate?
    } else {
        err = new Error('Unknown invite type');
    }

    return next(err);

});

inviteSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.lastModified = new Date();
        return next();
    }
    this.created = new Date();
    this.lastModified = new Date();
    return next();
});

module.exports = function (dbConnection) {
    var Invite;
    try {
        Invite = dbConnection.model('Invite');
    } catch (err) {
        if (!Invite) {
            Invite = dbConnection.model('Invite', inviteSchema);
        }
    }
    return Invite;
};

