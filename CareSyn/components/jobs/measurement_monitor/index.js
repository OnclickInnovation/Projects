'use strict';

var asyncMod = require('async');
var logger = require('logger');
var moment = require('moment');
var Q = require('q');
var scheduler = require('../index');
var bin = require('./bin');
var config = require('config');

var MeasurementMonitorModel = require('models').MeasurementMonitor;
var UserModel = require('models').User;
var OauthMonitorTokenModel = require('models').OauthMonitorToken;
var MonitorModel = require('models').Monitor;
var MeasurementModel = require('models').Measurement;

var todayBegins = moment().utc().startOf('day').toDate();
var todayEnds = moment().utc().endOf('day').toDate();

/**
* Divide all the monitors into blocking and non blocking queues.
* Process them at same time in different workers
*/
var checkMonitors = function(measurements){
    var deferred = Q.defer();

    var apiQueue = []; // monitor which will call API data

    measurements.forEach(function(measurement){
            apiQueue.push(function(callback){
                bin.checkByAPI(measurement)
                .then(function(data){
                    callback(null, data);
                })
                .catch(function(e){
                    callback(e, null);
                });
            });
    });

    logger.info('API Queue : ' + apiQueue.length + '/' + measurements.length);

    //Limit the API processing to max 5 at a time
    var deferredAPI = Q.defer();

    asyncMod.parallelLimit(apiQueue, config.get('cron.parallelLimit'), function(err, results){
        if(err){
            deferredAPI.resolve(err);
        } else {
            deferredAPI.resolve(results);
        }
    });

    //run queue
    Q.all([deferredAPI.promise])
    .then(deferred.resolve)
    .catch(deferred.reject);

    return deferred.promise;
};


/**
* Cron Job logic, It pick all monitor , get API data and will then report missed/out of range monitors
*/

var task = function(){
    var deferred = Q.defer();

    //find all the model which are in range
    MeasurementMonitorModel.findAll({
        where: {
            //select monitors which were scheduled for today
            $and: {
                process_time: {
                    $or: {
                        $lt: todayBegins,
                        $eq: null
                    }
                },
                next_reading: {
                    $lt: todayEnds
                }
            }
        },
        include: [OauthMonitorTokenModel,
                    MeasurementModel,
                    {model: MonitorModel,
                     where: {
                            notify: {
                                        $eq: true
                                    }
                            },
                      include: [UserModel]}]
    })
    .then(function(measurements){
        return checkMonitors(measurements);
    })
    .then(deferred.resolve)
    .catch(deferred.reject);

    return deferred.promise;
};


/**
* Start the monitor cron job
*/
module.exports.beginExecution = function(){

    scheduler.everyMidnight(task, function(){
        logger.info("Monitor Cron Job Done");
    }, function(e){
        logger.error("Failed Monitor Cron Job due to : " + e);
    });

    logger.info("Monitor Cron Setup: Done");
};
