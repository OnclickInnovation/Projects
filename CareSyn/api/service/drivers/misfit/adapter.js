"use strict";
var units = require("../base/units");
var _ = require('lodash');
var moment = require('moment');

/** parse the results from fitbit API to a mobile consumable code **/

var keyIndex = {};
keyIndex["sleep-minutesAsleep"] = "Minutes asleep";
keyIndex["activities-steps"] = "Steps";
keyIndex["user"] = "General Details";
keyIndex["body-weight"] = "Body Weight";
keyIndex["sleeps"] = "Sleep";
keyIndex["weight"] = "Weight";
keyIndex["sessions"] = "Steps";
keyIndex["summary"] = "Steps";

//temp store for user data  and units
var userData = null;

module.exports.parse = function(results, days, timeStamps){
    var response = {};
    _.forEach(results, function(val, key){
        var key = Object.keys(val)[0];
        var tmp;

        //parse different type of data
        switch(key){
            case "user" :
            //store user details
            userData = val[key];
            break;

            case "sleeps" :
            tmp = parseSleepData(val[key], "duration", days, timeStamps);
            break;

            case "weight" :
            tmp = transformLog(val[key], "weight", days, timeStamps);
            break;

            //steps
            case "summary":
            tmp = transformActivity(val["summary"], days, timeStamps);
            break;

            default:
            tmp = transformActivity(val[key], days, timeStamps);
        }

        //some valid data was parsed
        if(!_.isEmpty(tmp)){

            //get custom name from keyIndex
            var resp_key = keyIndex[key];

            //decide if we can use it
            resp_key = (typeof resp_key === 'undefined') ? key : resp_key;
            //get unit for data
            if((key === "body-weight" || key === "weight") && userData != null){
                resp_key = units.embedUnit(resp_key, "weight", userData.weightUnit);

                //if standard for US are in use then convert metric data to US
                if(userData.weightUnit == "en_US")
                {
                    tmp = _.mapValues(tmp, function(val, key){
                        return (Math.round(val * 220.462) / 100);
                    });
                    //if standard for UK are in use then convert metric data to UK
                } else if(userData.weightUnit == "en_UK"){
                    tmp = _.mapValues(tmp, function(val, key){
                        return (Math.round(val * 15.7473) / 100);
                    });
                }

            }

            response[resp_key] = tmp;
        }

    });

    return response;
};

module.exports.parseAll = function(results, days){
    return exports.parse(results, days, false);
};

/** transform a series of activity to avg **/
var transformActivity = function(data, days, timeStamps){
    if(data === undefined){
        return false;
    }

    var returns = {};
    var lastTime = {};

    //remove all data which is null
    data = _.filter(data, function(val){
        return val['steps'] != 0;
    });

    if(!days)
    {
        //now select only three latest dates
        data = data.slice(data.length - 3);
    }
    else {
        data = data.slice(data.length - days);
    }

    console.log(":::::: Parsing Misfit Data  ::::::::");

    data.forEach(function(val){
        var tmpKey = units.getFormattedDate(val["date"]);
        console.log(tmpKey, val['steps']);
        if(!returns[tmpKey]){
            returns[tmpKey] = val['steps'];
            lastTime[tmpKey] = tmpKey;
        }
        else if(tmpKey  == lastTime[tmpKey]) {
            //adding same date data
            returns[tmpKey] += val['steps'];
            lastTime[tmpKey] = tmpKey;
        }
        else
        {
            returns[tmpKey] = val['steps'];
        }
    });

    return returns;
};

/* Sleep data parser
**
* data        Object    Sleep data
* key         String    Duration in case of sleep
* days        Integer   Number of days
* timeStamps  Boolean   Timestamps
*/
var parseSleepData = function(data, key, days, timeStamps){
    if(data === undefined){
        return false;
    }

    var returns = {};
    var lastTime = {};

    //now select only three latest dates
    if(!days && data.length > 3){
        data = data.slice(data.length - 3);
    }
    else {
        data = data.slice(data.length - days);
    }

    console.log(":::::: Parsing Misfit Data  ::::::::");

    data.forEach(function(val){
        var tmpKey = units.getFormattedDate(val["startTime"]);
        //seconds to hrs
        val[key] = parseFloat((val[key] / 3600).toFixed(2));

        console.log(tmpKey, val[key]);
        if(!returns[tmpKey]){
            returns[tmpKey] = val[key];
            lastTime[tmpKey] = tmpKey;
        }
        else if(tmpKey  == lastTime[tmpKey]) {
            //adding same date data
            returns[tmpKey] += val[key];
            lastTime[tmpKey] = tmpKey;
        }
        else
        {
            returns[tmpKey] = val[key];
        }
    });

    return returns;
};
