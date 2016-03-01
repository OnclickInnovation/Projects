'use strict';

var moment = require('moment');
var _ = require('lodash');

exports.timeBlocks = function(next_reading, repeat_within_seconds, blocksPerDay){

  var arrDates = [];
  var next_reading_date = moment(next_reading).startOf('day');
  var end_reading_date = moment(next_reading).endOf('day');
  var i = 0;

  while(i < (blocksPerDay - 1))
  {
    next_reading_date = next_reading_date.add(repeat_within_seconds, 'seconds');
    arrDates.push(next_reading_date.unix());
    i++;
  }
  arrDates.push(end_reading_date.unix());
  return arrDates;

};

exports.timeBlocksForDateRange = function(next_reading, repeat_within_seconds, blocksPerDay){
 var repeat_second_less_by_one = repeat_within_seconds - 1;
  var arrDates = [];
  var next_reading_date = moment(next_reading).startOf('day').subtract(86400, 'seconds');
  var i = 0;
  while(i < (blocksPerDay))
  {
      if(i == 0){
          next_reading_date = next_reading_date.add(repeat_second_less_by_one, 'seconds');
      }else{
         next_reading_date = next_reading_date.add(repeat_within_seconds, 'seconds');
      }
    arrDates.push(next_reading_date.unix());
    i++;
  }
  return arrDates;
};

exports.getSameDateReadings = function(readingObj, next_reading){
  var todayReadings = [];

  _.forEach(readingObj, function(n, key){
    var sameDate = moment(key, 'D MMM YYYY HH:mm:ss').isSame(next_reading, 'day');
    if(sameDate)
    {
      todayReadings.push({'date': moment(key, 'D MMM YYYY HH:mm:ss').unix(), 'value': n});
    }
  });

  return todayReadings;
};

exports.compareDates = function(blockDate, resultDates, repeat){
  if(!resultDates)
  {
    return false;
  }
  var dates = [];
  resultDates.forEach(function(n){
    var lowerLimit = moment.unix(blockDate).subtract(repeat - 1, 'seconds').unix();
    if( (lowerLimit <= n.date) && (n.date <= blockDate) )
    {
        dates.push(n);
    }
  });
  return dates;
};

exports.maxReading = function(readings){
  var maxReadingDate = _.max(readings,
      function(reading){
        return reading.value;
      });

  return maxReadingDate;

};

exports.getRangeReadings = function(readingObj, next_reading, repeat_within_seconds){
  var readings = [];

  var lessThenADay = false, lowest_allowed_reading_date, highest_allowed_date;

  //if readings are for less than a day
  lessThenADay = repeat_within_seconds < 86400;

  //get lowest allowed reading
  lowest_allowed_reading_date = moment(next_reading).startOf('day').subtract(1, 'day');

  //get highest allowed reading
  highest_allowed_date = moment(next_reading).endOf('day').subtract(86400, 'seconds');

  //if readings are across days then range is extend for using 'days'
  if(!lessThenADay){
          lowest_allowed_reading_date = lowest_allowed_reading_date.subtract(1, 'day');
          highest_allowed_date = highest_allowed_date.add(1, 'days');
   }

   console.log("Start : " + lowest_allowed_reading_date.toString() + " End : " + highest_allowed_date.toString());

  _.forEach(readingObj, function(n, key){
    var currDate = moment(key, 'D MMM YYYY HH:mm:ss');
    var inRange;

    if(lessThenADay) //hourly selection for smaller readings
    {
        inRange = currDate.isBetween(lowest_allowed_reading_date, highest_allowed_date, 'hours');
    }
    else // days selections for larger readings
    {
        inRange = currDate.isBetween(lowest_allowed_reading_date, highest_allowed_date, 'days');
    }

    if(inRange)
    {
        console.log("Selected : " + currDate.toString() + " reading " + n);
        readings.push({'date': currDate.unix(), 'value': n});
    }
  });

  return readings;
};
