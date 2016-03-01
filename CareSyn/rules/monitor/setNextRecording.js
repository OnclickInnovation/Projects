'use strict';

var moment = require('moment');

/**
 * Set next reading date for the model
 *
 * @param fromDate,              Datetime Object, The date from which calculation will start
 * @param next_reading,          Datetime Object, Next reading date last used
 * @param repeat_within_seconds, Integer        , seconds in which interval is repeated
 *
 * @param Datetime Object
 */
module.exports = function(fromDate, next_reading, repeat_within_seconds){

    fromDate = fromDate || new Date();

    //never set next reading
    if(!next_reading){
      fromDate.setSeconds(fromDate.getSeconds() + repeat_within_seconds);
      return fromDate;
    }

    //we have the next_reading and last_recorded
    if(next_reading){

      //get time
      var tNext = parseInt(new Date(next_reading).getTime() / 1000);
      var tFrom = parseInt(new Date(fromDate).getTime() / 1000);

      //if next_reading and fromDate are closer than repeat interval
      if((tNext - tFrom) <= repeat_within_seconds){
        fromDate = moment(next_reading).isBefore() ? new Date() : new Date(next_reading);
        fromDate.setSeconds(fromDate.getSeconds() + repeat_within_seconds);
        next_reading = fromDate;
      }

      return next_reading;
    }
};
