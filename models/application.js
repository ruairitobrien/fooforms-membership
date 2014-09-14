"use strict";


var Application = function (args) {
    var app = {};
    // Unique name for user
    app.displayName = args.displayName;
    app.email = args.email;
    app.password = args.password;
    app.confirmPass = args.confirmPass;
    // Name for organisation submitted in the sign up form
    app.organisationName = args.organisationName;
    app.status = 'pending';
    app.message = null;
    // The Mongoose User object when it gets created.
    app.user = null;
    // The Mongoose Organisation object when it gets created.
    app.organisation = null;


    app.isValid = function () {
        return app.status === 'validated';
    };

    app.setInvalid = function (message) {
        app.status = 'invalid';
        if(message) {app.message = message;}
    };

    app.validate = function () {
        app.status = 'validated';
    };

    return app;
};

module.exports = Application;
