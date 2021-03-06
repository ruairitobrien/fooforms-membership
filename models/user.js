/*jslint node: true */
'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var authTypes = ['github', 'twitter', 'facebook', 'google', 'yahoo', 'linkedin'];

var userSchema = mongoose.Schema({
    // Users full name
    name: {
        familyName: {type: String},
        givenName: {type: String},
        middleName: {type: String}
    },
    screenName: {
      type: String
    },
    // Users unique display/user name
    displayName: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String
    },
    salt: String,
    // Admin users see more of the site
    admin: {
        type: Boolean,
        default: false
    },
    photo: {
        type: String
    },
    // List of forms that this User owns
    folders: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Folder'
        }
    ],
    // List of teams the user is a member of
    teams: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Team'
        }
    ],
    organisations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Organisation'
        }
    ],
    // When the account was first created
    created: Date,
    // When the user last update their profile
    lastModified: Date,
    // When the user last logged in the the system
    lastLogin: Date,
    // How many times this user has logged in to the system
    signInCount: {
        type: Number,
        default: 0
    },
    // Status indication if user needs to be confirmed (or any other status that may be required)
    status: {
        type: String,
        required: true,
        default: 'pending'
    },
    // OAuth values
    provider: {
        type: String,
        default: 'local'
    },
    facebook: {},
    twitter: {},
    github: {},
    google: {},
    yahoo: {},
    linkedin: {},
    deleted: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

/**
 * Checks if a value is null or empty
 * @param value
 * @returns If the value is null or has no length(empty)
 */
var notNullOrEmpty = function (value) {
    return value && value.length;
};

userSchema.path('email').validate(function (email) {
    if (authTypes.indexOf(this.provider) !== -1) {
        return true;
    }
    return notNullOrEmpty(email);
}, 'Email cannot be blank');

userSchema.path('displayName').validate(function (displayName) {
    if (authTypes.indexOf(this.provider) !== -1) {
        return true;
    }
    return notNullOrEmpty(displayName);
}, 'Username cannot be blank');

userSchema.path('password').validate(function (password) {
    if (authTypes.indexOf(this.provider) !== -1) {
        return true;
    }
    return notNullOrEmpty(password);
}, 'Password cannot be blank');

/**
 * Pre-save hook
 */
userSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.lastModified = new Date();
        return next();
    }
    this.created = new Date();
    this.lastModified = new Date();

    // If no password is present and we are not using a provider, return an error in the callback
    if (!notNullOrEmpty(this.password) && authTypes.indexOf(this.provider) === -1) {
        next(new Error('Invalid password'));
    }
    else {
        next();
    }
});

/**
 * Statics
 */

userSchema.statics.findByDisplayName = function (displayName, next) {
    this.findOne({ displayName: displayName }, next);
};

userSchema.statics.findUserByEmail = function (email, next) {
    this.findOne({ email: email }, next);
};

/**
 * Pretty much the same as findByDisplayName but does alphabetic search returning a list of matches
 * rather than searching for a single user by unique name.
 *
 * @param searchText
 * @param next
 */
userSchema.statics.searchByDisplayName = function (searchText, next) {
    this.find({displayName: new RegExp('^' + searchText, 'i')}, next);
};

module.exports = function (dbConnection) {
    var User;
    try {
        User = dbConnection.model('User');
    } catch (err) {
        if(!User) {
            User = dbConnection.model('User', userSchema);
        }
    }
    return User;
};
