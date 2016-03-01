/**
 * Express configuration
 */

'use strict';

var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var config = require('config');
var mysql = require('mysql');

module.exports = function(app) {
    app.set('views', 'server/views');
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.use(compression());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(methodOverride());

    var session = require('express-session');
    var SessionStore = require('express-mysql-session');

    app.use(session({
        secret: config.get('session.secret'),
        header: 'X-Session-Token',
        cookie: null,
        saveUninitialized: false,
        resave: false,
        store: new SessionStore({
          //Session Driver
          sessionConstructor: session.Session,
          // maximum age of a valid session in milliseconds
          // fallback to 24 minutes if nothing supplied
          expiration: config.get('session.expiration') || 1440000
        }, mysql.createConnection(config.get('db.uri')))
    }));

    app.use(morgan('dev'));

    if (config.get('logging.level') > 1) {
        app.set('appPath', 'client');
        app.use(morgan('dev'));
        app.use(errorHandler()); // Error handler - has to be last
    }

};
