/**
* Main application file
*/
'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || "development";

var config = require("config");
var logger = require("logger");

//Setup NewRelic diagnosis
if(config.get('newrelic.enabled')){
    require('newrelic');
    logger.info("New Relic: Enabled " + config.get('newrelic.app_name') + " : " + config.get('newrelic.level'));
}

// Setup server
var express = require("express");
var app = express();

if(process.env.NODE_ENV === 'development'){
    app.use(require('cors')());
    logger.warn("CORS: Enabled");
}

var server = require("http").createServer(app);

/**
* Load DB Models
*/
require("models");

/**
* Setup express and application
*/
require("./config")(app);

/**
* Load services we provide
*/
require("./components/servicemap")
.setupServicesMap()
.then(function(){

    logger.trace('New Services and Measurments Created');

    return require("./components/servicemap/servicelist")
    .bindServices()
    .then(function(){
        logger.info("Service Matrix Setup: Done");
        /**
        * Load in route handlers
        */
        require("./routes")(app);

        // Start server
        server.listen(config.get("server.port"), config.get("server.ip"), function () {
            logger.info("Express server listening on " + config.get("server.port") + ", in " + app.get("env") + " mode");
        });
    });
})
.then(function(){
    /**
    * Setup CRON and Queues
    */
    return require("./components/jobs").registerAll();

})
.catch(function(e){
    logger.error("Service Matrix Setup: Failed");
    logger.error(e);
});

// Expose app
module.exports = app;
