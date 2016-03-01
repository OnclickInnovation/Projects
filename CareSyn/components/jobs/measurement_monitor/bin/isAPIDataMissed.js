'use strict';

var Q = require('q');
var helpers = require('./helpers');
var _ = require('lodash');

/**
 * Check from the readings if the any reading was missed in all measurement blocks
 *
 * Resolve(true) : yes some blocks was Missed
 * Resolve(false) : Data was perfect and available for all frequencies
 * Reject(error) : Error state
 */
module.exports = function(readings, repeat_interval, next_reading, sensitivity){
    var deferred = Q.defer();
    var blocksPerDay = parseInt(86400 / repeat_interval);

    //dont ignore any missed data by default
    sensitivity = sensitivity || 1;

    //for reading larger than day readings dont generate timeblocks
    if(repeat_interval >= 86400)
    {
        //just check if readings exists
        deferred.resolve(_.isEmpty(readings));
        return deferred.promise;
    }

    //generate time blocks for date
    var arrDates = helpers.timeBlocksForDateRange(next_reading, repeat_interval, blocksPerDay);
    var isMissed = false;
    // track how many timeblocks has been missed
    var counter = 0;

    //scan each block
    for(var i = 0; i < arrDates.length; i++) {

        if(isMissed === false){
            //if no reading for a block is found
            isMissed = _.isEmpty(helpers.compareDates(arrDates[i], readings, repeat_interval));
        }

        if(isMissed){
            counter++;
            if(counter >= sensitivity){ //if the consective fails marked
                break;
            }
        } else {
            counter = 0;
        }
    }

    deferred.resolve(isMissed);
    return deferred.promise;
};
