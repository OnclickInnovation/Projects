'use strict';

var pluralize = require("pluralize");
var moment = require("moment");

/** A small library for fetching the Units for each system **/

/** United States of America Based standards **/
var US = {
  duration        : "milliseconds",
  distance        : "miles",
  elevation       : "feet",
  height          : "inches",
  weight          : "lbs",
  measurements    : "inches",
  liquids         : "fl oz",
  "blood glucose" : "mg/dL",
  sleep           : "hours"
};

/** European Standards **/
var UK = {
  duration        : "milliseconds",
  distance        : "kilometers",
  elevation       : "meters",
  height          : "centimeters",
  weight          : "stone",
  measurements    : "centimeters",
  liquids         : "milliliters",
  "blood glucose" : "mmol/l",
  sleep           : "hours"
};

/** Indian and other SI Based systems  **/
var Metric = {
  duration        : "milliseconds",
  distance        : "kilometers",
  elevation       : "meters",
  height          : "centimeters",
  weight          : "kilograms",
  measurements    : "centimeters",
  liquids         : "milliliters",
  "blood glucose" : "mmol/l",
  sleep           : "hours"
};

/** generate a formated date for display in api response **/
exports.getFormattedDate = function(dateTime){
  return moment(dateTime).format("D MMM YYYY").toString();
};
exports.getFormattedDateTime = function(dateTime){
  return moment(dateTime).format("D MMM YYYY HH:mm:ss").toString();
};
exports.getFormattedDateTimeUnix = function(dateTime){
  return moment.unix(dateTime).format("D MMM YYYY HH:mm:ss").toString();
};

exports.getUnixFromFormattedDateTime = function(dateTime){
  return moment(dateTime, "D MMM YYYY HH:mm:ss").unix();
};

/** generate a formated date for display in api response **/
exports.getFormattedDateFromUnix = function(unix){
  return moment.unix(unix).format("D MMM YYYY").toString();
};

/** generate a unix timestamp form date **/
exports.getUnix = function(dateTime){
  return moment(dateTime).unix();
};

/**
  Accept any data and return a unit suffixed string

  @param data Int ,
  @parma type String , The type which you want to access "height , weight"
  @param system String , en_US / en_GB / METRIC or (null == METRIC)
*/
exports.getUnitConverted = function(data, type, system){


    var unit = this.getUnit(type, system);

    //selected type not found
    if(!unit){
      return data;
    }

    return (data + " " + pluralize(unit, data));
};

/** returns the unit for a system **/
exports.getUnit = function(type, system){
    switch(system){

      case "en_US" :
        system = US;
      break;

      case "en_GB" :
        system = UK;
      break;

      case "METRIC" :
      default :
      system = Metric;

    }

    return (system[type] === undefined) ? false : system[type];
};

exports.createTimeBlocks = function(currentMonitor, blocksPerDay){

  var arrDates = [];
  var next_reading_date = moment(currentMonitor.next_reading).startOf('day');
  var end_reading_date = moment(currentMonitor.next_reading).endOf('day');
  var i = 0;

  while(i < (blocksPerDay - 1))
  {
     next_reading_date = moment(next_reading_date).add(currentMonitor.repeat_within_seconds, 'seconds');
     arrDates.push(moment(next_reading_date).utc().unix());
     i++;
  }
  arrDates.push(moment(end_reading_date).utc().unix());

  return arrDates;
};

/** suffix (<unit>) with a string **/
exports.embedUnit = function(string, type, system){
  var unit = this.getUnit(type, system);

  return (unit === false) ? string : string + " (" + unit + ")";

};

/**
*
* Rounding off function for decimal value
* @param val, Integer , measurement reading of weight
*
**/
exports.getRoundOff = function(val){

    var result = (Math.round(val * 2) / 2).toFixed(1);

    return isNaN(result) ? null : result.replace(/\.0+$/, '');

};
