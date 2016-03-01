'use strict';
var units = require("../base/units");
var _ = require('lodash');
var moment = require('moment');

var glucose_key = "Glucose (" + units.getUnit("blood glucose", "en_US") + ")";
var weight_key = "Weight (" + units.getUnit("weight", "en_US") + ")";

//parse the data from iHealth api to meaningful information
/**
* limit   integer    Number of days
* bp      object     Blood Pressure data
* bg      object     Body Glucose data
* bo      object     Blood Oxygen data
* we      object     Weight data
* ac      object     Steps data
*/
module.exports.parse = function(limit, bp, bg, bo, we, ac){
    var response = {};
    limit = limit ? limit : 3;

    if(bp){
        response["Blood Pressure"] = parseDateData(bp['BPDataList'], function(a){return a['HP'] + '/' + a['LP']; }, limit, false);
    }

    if(bg){
        response[glucose_key] = getHighPerDay(bg['BGDataList'], function(a){return a['BG']; }, limit, false);
    }

    if(bo){
        response["Blood Oxygen (%)"] = parseDateData(bo['BODataList'], function(a){return a['BO']; }, limit, false);
    }

    if(we){
        response[weight_key] = parseDateData(we['WeightDataList'], function(a){return a['WeightValue'].toFixed(2); }, limit, false);
    }

    if(ac){
        response["Steps"] = avgDateData(ac['ARDataList'], function(a){return a['Steps']; }, limit, false);
    }

    //remove the empty keys
    response = _.transform(response, function(res, v, k) {
        if (!_.isEmpty(v)) {
            res[k] = v;
        }
    });

    return response;

};

/**
* limit   integer    Number of days
* bp      object     Blood Pressure data
* bg      object     Body Glucose data
* bo      object     Blood Oxygen data
* we      object     Weight data
* ac      object     Steps data
*/
module.exports.parseAll = function(limit, bp, bg, bo, we, ac){
    var response = {};

    if(bp){
        response["Blood Pressure"] = parseDateData(bp['BPDataList'], function(a){return a['HP'] + '/' + a['LP']; }, limit, true);
    }

    if(bg){
        response[glucose_key] = getHighPerDay(bg['BGDataList'], function(a){return a['BG']; }, limit, true);
    }

    if(bo){
        response["Blood Oxygen (%)"] = parseDateData(bo['BODataList'], function(a){return a['BO']; }, limit, true);
    }

    if(we){
        response[weight_key] = parseDateData(we['WeightDataList'], function(a){return a['WeightValue'].toFixed(2); }, limit, true);
    }

    if(ac){
        response["Steps"] = avgDateData(ac['ARDataList'], function(a){return a['Steps']}, limit);
    }

    //remove the empty keys
    response = _.transform(response, function(res, v, k) {
        if (!_.isEmpty(v)) {
            res[k] = v;
        }
    });

    return response;

};

//convert date's into UTC
/**
* data     array       Data
*/
var updateTimeZone = function(data){
    if(data)
    {
        data.forEach(function(val){
            val["MDate"] = parseInt(val["MDate"] - (val["TimeZone"] * 36));
        });
        return data;
    }
}

//parse the date data into per day records
/**
* data     array       Data
* selector function    To select the quantity
* noOfDays integer     Number of days
* tmpStmp boolean      time Stamp
*/
var parseDateData = function(data, selector, noOfDays, tmpStmp){
    data = updateTimeZone(data);

    if(_.isEmpty(data)){
        return false;
    }

    console.log(":::::: Parsing iHealth Data  ::::::::");
    data.reverse();
    //if we want unfiltered data then
    if(_.isNumber(noOfDays)){
        var lastAccessDate = moment.unix(data[0].MDate).startOf('day').subtract(noOfDays, 'days').unix();
        data = _.filter(data, function(v){
            return (v.MDate >= lastAccessDate);
        });
    }
    var returns = {};
    var lastTime = {};

    data.forEach(function(val){

        val['quantity'] = selector(val);

        if(!tmpStmp)
        {
            var tmpKey = units.getFormattedDateFromUnix(val["MDate"]);
        }
        else {
            var tmpKey = units.getFormattedDateTimeUnix(val["MDate"]);
        }

        console.log(tmpKey,moment.unix(val["MDate"] + (val["TimeZone"] * 3600)).toString(), val['quantity']);

        var tmpTime = val["MDate"];

        if(!returns[tmpKey]){
            returns[tmpKey] = val['quantity'];
            lastTime[tmpKey] = tmpTime;
        } else if(tmpTime > lastTime[tmpKey]) {
            returns[tmpKey] = val['quantity'];
        }

    });

    return returns;

};
//filter the data from iHealth with selection of highest per day
/**
* data     array       Data
* selector function    To select the quantity
* noOfDays integer     Number of days
* tmpStmp boolean      time Stamp
*/
var getHighPerDay = function(data, parser, noOfDays, tmpStmp){
    data = updateTimeZone(data);

    if(_.isEmpty(data)){
        return false;
    }

    console.log(":::::: Parsing iHealth Data  ::::::::");

    data.reverse();
    //if we want unfiltered data then
    if(_.isNumber(noOfDays)){
        var lastAccessDate = moment.unix(data[0].MDate).startOf('day').subtract(noOfDays, 'days').unix();
        data = _.filter(data, function(v){
            return (v.MDate >= lastAccessDate);
        });
    }
    var returns = {};

    data.forEach(function(val){

        val['quantity'] = parser(val);
        if(!tmpStmp) {
            var tmpKey = units.getFormattedDateFromUnix(val["MDate"]);
        }
        else {
            var tmpKey = units.getFormattedDateTimeUnix(val["MDate"]);
        }

        console.log(tmpKey, val["MDate"], val['quantity']);

        if(!returns[tmpKey]){
            returns[tmpKey] = val['quantity'];
        } else if(val > returns[tmpKey]) {
            returns[tmpKey] = val['quantity'];
        }

    });

    return returns;
};

//filter the data from iHealth and add same day data
/**
* data     array       Data
* selector function    To select the quantity
* noOfDays integer     Number of days
* tmpStmp boolean      time Stamp
*/
var avgDateData = function(data, selector, noOfDays, tmpStmp){

    data = updateTimeZone(data);

    if(_.isEmpty(data)){
        return false;
    }

    console.log(":::::: Parsing iHealth Data  ::::::::");
    data.reverse();
    //if we want unfiltered data then
    if(_.isNumber(noOfDays)){
        var lastAccessDate = moment.unix(data[0].MDate).startOf('day').subtract(noOfDays, 'days').unix();
        data = _.filter(data, function(v){
            return (v.MDate >= lastAccessDate);
        });
    }
    var returns = {};
    var lastTime = {};

    data.forEach(function(val){

        val['quantity'] = selector(val);

        if(!tmpStmp)
        {
            var tmpKey = units.getFormattedDateFromUnix(val["MDate"]);
        }
        else {
            var tmpKey = units.getFormattedDateTimeUnix(val["MDate"]);
        }

        console.log(tmpKey, val["MDate"], val['quantity']);

        var tmpTime = val["MDate"];

        if(!returns[tmpKey]){
            returns[tmpKey] = val['quantity'];
            lastTime[tmpKey] = tmpTime;
        } else if(tmpTime > lastTime[tmpKey]) {
            returns[tmpKey] = val['quantity'];
        }
        else {
            //adding same date data
            returns[tmpKey] += val['quantity'];
            lastTime[tmpKey] = tmpTime;
        }

    });

    return returns;

};
