'use strict';

var moment = require('moment');

/**
 * Calculate the missed date by using the processed time and next reading date
 *
 * @param next_reading , DateTime | String , Date when cron job will run.
 *                                           User need to take reading before this date
 * @param process_time , DateTime | String | Null, Date when cron job last ran
 * @param repeat_within_seconds , INTEGER, Seconds after which reading is taken
 *
 * @return Boolean
 */
module.exports = function(next_reading, process_time, repeat_within_seconds){
  if(!next_reading && !process_time){
      return false;
  }

  repeat_within_seconds = repeat_within_seconds || 86400;

  var now = moment();

  //if repeat interval is lower than a day then increase precision
  var precision = (repeat_within_seconds / 86400) >= 1 ? 'day' : 'hour';

  next_reading = moment(next_reading);

  //process time not set when measurement map doesnt take part to cron job
  if(!process_time){
      return next_reading.isBefore(now, precision) || next_reading.isSame(now, precision);
  }

  process_time = moment(process_time);

  //if cron has ran even after reading date
  if((next_reading.isBefore(now, precision) || next_reading.isSame(now, precision)) && (process_time.isSame(now, precision) || process_time.isAfter(now, precision)) ){
      return true;
  }

  if(next_reading.isBefore(now, precision)){
      return true;
  }

  return false;
};
