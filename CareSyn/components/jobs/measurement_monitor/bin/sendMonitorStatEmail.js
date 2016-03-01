'use strict';

var Q = require('q');
var logger = require('logger');
var mailer = require('../../../../emails');
var bin = require('./index');

/**
* Send Monitor status email if passed a monitor
* Decide on immediate available data dont use API to fetch new records.
*/
module.exports = function(measurement)
{
    var deferred = Q.defer();
    var noMail = true; //indicate no email was sent
    Q
    .all([bin.getReceiverEmails(measurement.Monitor.User), bin.setProcessed(measurement)])
    .then(function(arr){
        var emails = arr[0];
        if(measurement.isOutofBounds()){
            var sendOutofBoundEmails = [];
            emails.forEach(function(email){
                sendOutofBoundEmails
                .push(mailer.sendOverflowMonitorMail(email, measurement.Monitor.patient_code, measurement.last_recorded, measurement.Monitor.description));
            });

            Q.all(sendOutofBoundEmails)
            .then(deferred.resolve)
            .catch(deferred.reject);
            logger.debug("Measurement " + measurement.id + " is out of bounds " + new Date());

            noMail = false;
        }

        if(measurement.isMissed()){
            var sendMissedEmails = [];
            emails.forEach(function(email){
                sendMissedEmails
                .push(mailer.sendMissedMonitorMail(email, measurement.Monitor.patient_code, measurement.next_reading, false, measurement.Monitor.description));
            });

            Q.all(sendMissedEmails)
            .then(deferred.resolve)
            .catch(deferred.reject);

            noMail = false;
        }

        if(noMail){
            logger.debug("Measurement " + measurement.id + " is safe");
            deferred.resolve(); // incase no email send resolve
        }

    }).catch(function(err){
        deferred.reject(err);
    });

    return deferred.promise;
};
