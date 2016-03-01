'use strict';

var units = require("../base/units");
var moment = require("moment");
var _ = require("lodash");

/** parse the results from Withings API to a mobile consumable code **/

/**
* Parse activities and get the steps data
*
* @param data      , Collection , Steps data for two date range
* @param noOfDays  , Integer    , how many days data we need
*
* @return Object , contain data for each date with value
*/
var parseStepsFromActivities = function(data, noOfDays){

    if(_.isEmpty(data)){
        return false;
    }

    data = data.reverse();

    //get the filtered data
    data = data.slice(0, noOfDays);

    var response = {};

    data.forEach(function(v){
        response[v.date] = v.steps;
    });

    if(_.isEmpty(response)){
        return false;
    }

    return response;
};

/**
* Get a measurement from the Body measurement object
*
* @param data          , Object | Collection , contain all data from webservice response body
* @param measurementId , Integer             , measurement which we need to pick from response. its provided by withings
* @param noOfDays      , Integer             , how many days data we need
* @param timeStamps    , Boolean             , response with timestamps or date only
*
* @return Object , contain datewise divison to data
*/
var fetchMeasurmentFromBodyMeasure = function(data, measurementId, noOfDays, timeStamps){

    if(_.isEmpty(data)){
        return false;
    }
    var data_new = _.find(data, function(val){
        return val.measures[0].type == measurementId;
     });
     if(data_new){
         //if we want filtered data then
         if(_.isNumber(noOfDays)){
             var lastAccessDate = moment.unix(data_new.date).startOf('day').subtract(noOfDays, 'days').unix();
             data = _.filter(data, function(v){
                 return (v.date >= lastAccessDate);
             });
         }
     }
    var returns = {};

    data.forEach(function(val){

        var tmpKey = timeStamps ? units.getFormattedDateTimeUnix(val.date) : units.getFormattedDateFromUnix(val.date);
        var measure = getDataFromMeasure(val.measures, measurementId);

        if(measure){
            returns[tmpKey] = measure;
        }

    });

    return returns;
};

/**
* Extract the data from the measurement array based of measurementId,
* method combine the blood pressure data when either SP or DP id are passed
*
* @param measureArray  , Array   , Data from which we will fetch measurementId
* @param measurementId , Integer , Withings measurementId for specific type of data
*
*/
var getDataFromMeasure = function(measureArray, measurementId){

    if(_.isEmpty(measureArray)){
        return false;
    }

    //blodd pressure key need to be combined
    if(measurementId === 9 || measurementId === 10){

        //get blood pressure readings
        var dp = measureArray.filter(function (measure) { return measure.type === 9; });
        var sp = measureArray.filter(function (measure) { return measure.type === 10; });

        //no blood presure readings
        if(_.isEmpty(dp) || _.isEmpty(sp)){
            return false;
        }

        return (sp[0].value * Math.pow(10, sp[0].unit)) + "/" + (dp[0].value * Math.pow(10, dp[0].unit));
    }

    var tmp = measureArray.filter(function (measure) { return measure.type === measurementId; });

    if(_.isEmpty(tmp)){
        return false;
    }

    //withings return all data as power of 10 , convert to actual
    tmp = tmp[0].value * Math.pow(10, tmp[0].unit);

    //weight need to be converted to pounds
    if(measurementId === 1){
        tmp = (Math.round(tmp * 220.462) / 100);
        tmp = units.getRoundOff(tmp);
    }

    return tmp;

};

/**
* Slice an object for its own key to specific count, then attach it to main object
*
* @param response , Object      , to attach results to
* @param data     , Collection  , data to attach after filtering
* @param key      , String      , Key name under which the data will be added
* @param count    , Integer     , how much data to filter
*
* @param Object | Collection , with new data attached under specified key
*/
var sliceObjectAndAttach = function(response, data, key, count){
    if(_.isEmpty(data)){
        return response;
    }

    var newobj = {};

    if(count){
        var i = 0;
        _.forEach(data, function(v, k){
            if(i < count){
                newobj[k] = v;
                i++;
            }
        });
    } else {
        newobj = data;
    }

    response[key] = newobj;
    return response;
};

exports.parse = function(body, activities, days){
    days = days || 3;
    var response = {};

    if(body){
        response = sliceObjectAndAttach(response, fetchMeasurmentFromBodyMeasure(body.measuregrps, 9), "Blood Pressure", days);
        response = sliceObjectAndAttach(response, fetchMeasurmentFromBodyMeasure(body.measuregrps, 11), "Heart Beat (bpm)", days);
        response = sliceObjectAndAttach(response, fetchMeasurmentFromBodyMeasure(body.measuregrps, 1), "Weight (lbs)", days);
    }

    if(activities){
        var stepsData = parseStepsFromActivities(activities.activities, days);

        if(!_.isEmpty(stepsData)){
            response["Steps"] = stepsData;
        }
    }

    return response;

};

exports.parseAll = function(body, activities, days){
    var response = {};
    if(body){
        response = sliceObjectAndAttach(response, fetchMeasurmentFromBodyMeasure(body.measuregrps, 9, days, true), "Blood Pressure");
        response = sliceObjectAndAttach(response, fetchMeasurmentFromBodyMeasure(body.measuregrps, 11, days, true), "Heart Beat (bpm)");
        response = sliceObjectAndAttach(response, fetchMeasurmentFromBodyMeasure(body.measuregrps, 1, days, true), "Weight (lbs)");
    }

    if(activities){
        var stepsData = parseStepsFromActivities(activities.activities, days);

        if(!_.isEmpty(stepsData)){
            response["Steps"] = stepsData;
        }
    }

    return response;

};
