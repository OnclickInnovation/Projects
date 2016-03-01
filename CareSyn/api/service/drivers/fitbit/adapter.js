"use strict";
var units = require("../base/units");
var _ = require('lodash');

/** parse the results from fitbit API to a mobile consumable code **/

var keyIndex = {};
keyIndex["sleep-timeInBed"] = "Sleep";
keyIndex["activities-steps"] = "Steps";
keyIndex["user"] = "General Details";
keyIndex["body-weight"] = "Body Weight";
keyIndex["weight"] = "Weight"

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

            case "sleep-timeInBed" :
            tmp = parseSleepData(val[key], "value", days, timeStamps);
            break;

            case "weight" :
            tmp = transformLog(val[key], "weight", days, timeStamps);
            break;

            default :
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
    return exports.parse(results, days, true);
};

/** transform a series of activity to avg **/
var transformActivity = function(data, days, timeStamps){
    if(data === undefined){
        return false;
    }

    var returns = {};

    //remove all data which is null
    data = _.filter(data, function(val){
        return val['value'] != 0;
    });

    if(!days)
    {
        //now select only three latest dates
        data = data.slice(data.length - 3);
    }
    else {
        data = data.slice(data.length - days);
    }

    data.reverse();

    data.forEach(function(val){
        var tmpKey = units.getFormattedDate(val["dateTime"]);
        returns[tmpKey] = val['value'];
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

    data.reverse();
    console.log(":::::: Parsing Fitbit Data  ::::::::");
    data.forEach(function(val){
        var tmpKey = units.getFormattedDate(val["dateTime"]);
        //milliseconds to hrs
        val[key] = parseFloat((val[key] / 60).toFixed(2));

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
/** transform a series of activity to logs **/
var transformLog = function(data, key, days, timeStamps){

    if(data === undefined){
        return false;
    }

    var returns = {};

    //now select only three latest dates
    if(!days && data.length > 3){
        data = data.slice(data.length - 3);
    }
    else {
        data = data.slice(data.length - days);
    }

    data.reverse();

    data.forEach(function(val){
        var tmpKey = units.getFormattedDate(val["date"]);
        if(timeStamps)
        {
            tmpKey = tmpKey + ' ' + val['time'];
        }
        returns[tmpKey] = val[key];
    });

    return returns;
};
