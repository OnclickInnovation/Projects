'use strict';

var Q = require('q');
var moment = require('moment');
var logger = require('logger');

/**
 * Update an monitor with reading, set it to use next reading date
 *
 * Resolve(true) : It worked, update is done
 * Resolve(false) : It falied, due to validations
 * Reject(error) : Update rejected with Error
 */
module.exports = function(measurement, reading, readingDate){

    var deferred = Q.defer();

    //convert to a string
    reading = reading ? reading.toString() : null;
    readingDate = moment.unix(readingDate).format('D MMM YYYY HH:mm:ss').toString();

    //gwet lowest allowed reading
    var lowest_allowed_reading_date = moment(measurement.next_reading)
                                        .startOf('day')
                                        .subtract(measurement.repeat_within_seconds, 'seconds');

    logger.debug('Measurement ' + measurement.id + ' : Lowest allowed date for the reading is ' + lowest_allowed_reading_date.toString());
    logger.debug('We are reading for ' + readingDate);
    logger.debug('Repeat interval was ' + measurement.repeat_within_seconds);

    //if the reading Date is below the required date then return
    if(lowest_allowed_reading_date.isAfter(moment(readingDate, 'D MMM YYYY HH:mm:ss'), 'day')){
        deferred.resolve(false);
    } else {
          measurement
              .updateAttributes({
                latest_reading: reading
              })
              .then(function(){
                  //reset Measurement's next reading date taking today as base
                  return measurement.setNextRecordingTime(new Date());
              })
              .then(function(measurementNew){
                  //if measurment is less than one day then set next reading to tomorrow
                  if(measurementNew.repeat_within_seconds < 86400){
                     return measurementNew.updateAttributes({
                         last_recorded: new Date(),
                         process_time: new Date(),
                         next_reading: moment().add(1, 'days').toDate()
                     });
                 } else {
                     return measurementNew.updateAttributes({
                         last_recorded: new Date(),
                         process_time: new Date()
                     });
                 }
              })
              .then(deferred.resolve)
              .catch(function(e){
                  deferred.reject(e);
              });
    }

    return deferred.promise;

};
