/*jslint node: true */
'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;


var teamSchema = new Schema({
    // Team name
    displayName: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    photo: {
        type: String
    },
    organisation: {
        type: Schema.Types.ObjectId,
        ref: 'Organisation'
    },
    // Members in this team
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    folders: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Folder'
        }
    ],
    permissionLevel: {
        type: String,
        default: 'read'
    },
    created: Date,
    lastModified: Date,
    deleted: {
        type: Boolean,
        default: false
    }
});

teamSchema.path('permissionLevel').validate(function (value) {
    return /admin|read|write/i.test(value);
}, '{VALUE} is an invalid permission level');

/**
 * Pre-save hook
 */
teamSchema.pre('save', function (next) {
    if (!this.isNew) {
        teamSchema.lastModified = new Date();
        return next();
    }
    this.created = new Date();
    this.lastModified = new Date();

    return next();
});

module.exports = function (dbConnection) {
    var Team ;
    try {
        Team = dbConnection.model('Team');
    } catch (err) {
        if(!Team) {
            Team = dbConnection.model('Team', teamSchema);
        }
    }
    return Team;

};
