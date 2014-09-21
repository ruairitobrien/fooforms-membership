/*jslint node: true */
'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var organisationSchema = mongoose.Schema({
    // Unique organisation name
    displayName: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Organisation title for display purposes
    title: {
        type: String
    },
    // Organisation website most likely
    domain: {
        type: String
    },
    // The email address to send invoices to
    billingEmail: {
        type: String,
        required: true,
        index: true
    },
    // An optional email address for public/internal display
    email: {
        type: String
    },
    // Organisation logo or somesuch
    photo: {
        type: String
    },
    // List of forms owned by this organisation
    forms: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Form'
        }
    ],
    // Creator is in this group by default but may allow addition of other users
    owners: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    // Teams collection to manage user groups
    teams: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Team'
        }
    ],
    created: Date,
    lastModified: Date,
    deleted: Boolean
});


/**
 * Pre-save hook
 */
organisationSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.lastModified = new Date();
        return next();
    }
    this.created = new Date();
    this.lastModified = new Date();

    return next();
});

/**
 * Statics
 */

organisationSchema.statics.findByDisplayName = function (displayName, next) {
    this.findOne({ displayName: displayName }, next);
};
organisationSchema.statics.searchByDisplayName = function (searchText, next) {
    this.find({displayName: new RegExp('^' + searchText, 'i')}, next);
};

module.exports = function (dbConnection) {
    var Organisation;
    try {
        Organisation = dbConnection.model('Organisation');
    } catch(err) {
        if(!Organisation) {
            Organisation = dbConnection.model('Organisation', organisationSchema);
        }
    }
    return Organisation;
};
