var uuid = require('node-uuid');

module.exports = function (config) {
    var self = this;
    config = config || {};
    if(!config.tokenName) {
        config.tokenName = "x-csrf";
    }

    this.createToken = function () {
        return uuid.v4();
    }

    this.attachToSession = function (session, done) {
        var token = this.createToken();
        session.csrf = token;
        session.save(function () {
            done(token)
        });

    }

    this.checkToken = function (req, res, next) {
        var raw = req.get(config.tokenName);
        if(!raw) {
            next({
                error: "Bad CSRF Token",
                code: "EBADCSRFTOKEN"
            });
            return;
        }
        var token = JSON.parse(raw);
        console.log("Current token is: " + req.get(config.tokenName))
        console.log("Session token is: " + req.session.csrf);
        if(req.session.csrf != token) {
            next({
                error: "Bad CSRF Token",
                code: "EBADCSRFTOKEN"
            })
        } else {
            next();
        }
    }
}
