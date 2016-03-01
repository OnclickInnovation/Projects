'use strict';

var logger = require('logger');
var Q = require('q');
var _ = require('lodash');

var driver = require('../../../../api/service/driver');
var reader = require('../../../../api/rest/monitor/measurements/reader');
var helper = require('./helpers');
var bin = require('./index');

/**
* Fetch monitor API data , process to see if monitor is valid
* Send emails in case of invalid status
*
* Resolve (true) : Done , no action required
* Resolve (false) : Need to send email on last known data
* Reject (Error) : Need to send email on last known data
*/
module.exports = function(measurement){
    var deferred = Q.defer();
    bin
    .getReceiverEmails(measurement.Monitor.User)
    .then(function(emails){
        //current monitor doesn't belong to any measurement
        if(!measurement)
        {
            logger.warn("Measurement has no data");
            deferred.reject();
            return deferred.promise;
        }
        var oauthData, serviceName;
        measurement
        .getAuthData(measurement.OauthMonitorToken)
        .then(function(oauthMonitor){
            //get Oauth data and service
            if(oauthMonitor){
                oauthData = JSON.parse(oauthMonitor.oauth_data);
                serviceName = oauthMonitor.service_name;
            }
            // //get Oauth data and service
            // var oauthData = JSON.parse(measurement.OauthMonitorToken.oauth_data);
            // var serviceName = measurement.OauthMonitorToken.service_name;

            //this monitor doesn't have any oauth data
            //mark it as missed
            if(!oauthData && !serviceName){
                emails.forEach(function(email){
                    bin.sendMissedEmail(email, measurement.Monitor.patient_code, new Date(), false, measurement.Monitor.description);
                });
                bin.setProcessed(measurement)
                .then(function(){
                    deferred.resolve(true);
                });
                return deferred.promise;
            }

            //set `all` param to true, get all the readings from API
            oauthData.all = true;
            oauthData.oauthModelInstance = measurement;
            return driver.getUserDetails(serviceName, oauthData).then(function(results){
                //Get latest readings
                var readingObj = reader(measurement.Measurement, serviceName, results, true);
                if(_.isEmpty(readingObj))
                {
                    logger.warn("Monitor try to read data which we dont support. Reader wasn't able to read service response");
                    logger.debug("MeasurementMonitor Id was " + measurement.id);
                    emails.forEach(function(email){
                        bin.sendMissedEmail(email, measurement.Monitor.patient_code, new Date(), false, measurement.Monitor.description);
                    });
                    return bin.setProcessed(measurement)
                    .then(function(){
                        deferred.resolve(true);
                    });
                }

                //get all reading for next_reading date
                var readings = helper.getRangeReadings(readingObj, measurement.next_reading, measurement.repeat_within_seconds);

                //No reading for range
                if(_.isEmpty(readings))
                {
                    //if no readings are found missed reading mail is sent
                    logger.debug('No Readings for Today or next reading date');
                    emails.forEach(function(email){
                        bin.sendMissedEmail(email, measurement.Monitor.patient_code, new Date(), false, measurement.Monitor.description);
                    });
                    return bin.setProcessed(measurement)
                    .then(function(){
                        deferred.resolve(true);
                    });
                }

                //we have some data process it
                return bin
                .isAPIDataMissed(readings, measurement.repeat_within_seconds, measurement.next_reading, measurement.sensitivity)
                .then(function(respMissed){
                    if(respMissed === true){ // yes it missed
                        console.log("Missed " + measurement.id);
                        emails.forEach(function(email){
                            bin.sendMissedEmail(email, measurement.Monitor.patient_code, new Date(), false, measurement.Monitor.description);
                        });
                        return bin.setProcessed(measurement)
                        .then(function(){
                            deferred.resolve(true);
                        });
                    } else {
                        return bin
                        .isAPIDataOutofBound(readings, measurement.upperbound, measurement.lowerbound, measurement.sensitivity)
                        .then(function(respOutofBound){
                            var readingToUpdate = respOutofBound[1];
                            respOutofBound = respOutofBound[0];
                            if(respOutofBound === true){
                                //yes it was out of range
                                console.log("Measurement Out of bound  " + measurement.id + " with " + readingToUpdate.value);
                                emails.forEach(function(email){
                                    bin.sendOutOfRangeEmail(email, measurement.Monitor.patient_code, new Date());
                                });
                            }
                            return bin.updateAndReset(measurement, readingToUpdate.value, readingToUpdate.date)
                            .then(function(updateStatus){
                                if(updateStatus === false){ //send missed email
                                    emails.forEach(function(email){
                                        bin.sendMissedEmail(email, measurement.Monitor.patient_code, new Date(), false, measurement.Monitor.description);
                                    });
                                    deferred.resolve(true);
                                } else {
                                    return bin.setProcessed(updateStatus)
                                    .then(function(){
                                        deferred.resolve(true);
                                    });
                                }
                            });
                        });
                    }
                });
            });
        })
        .catch(function(e){
            logger.debug(e);
            emails.forEach(function(email){
                bin.sendMissedEmail(email, measurement.Monitor.patient_code, new Date(), false, measurement.Monitor.description);
            });
            deferred.reject(e);
        });

    });
    return deferred.promise;
};
