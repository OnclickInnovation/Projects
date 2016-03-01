'use strict';

var units = require("../base/units");

var _ = require('lodash');
var moment = require('moment');

/**
* Parse the data from Jawbone api to meaningful information
*
* @param limit, Integer, Number of days , Default is 3 days
* @param sleep, Object , Sleep data
* @param step , Object , Steps data
*
* @return Collection , Data with each index
*/
module.exports.parse = function(limit, sleep, step){
    var response = {};
    limit = limit ? limit : 3;

    if(sleep)
    {
        response["Sleep"] = parseDateData(sleep.items, function(a){return parseFloat((a.duration / 3600).toFixed(2)); }, limit, false);
    }
    if(step)
    {
        response["Steps"] = parseDateData(step.items, function(a){return a.steps; }, limit, false);
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
* Parse the data from Jawbone api to meaningful information
*
* @param limit, Integer, Number of days
* @param sleep, Object , Sleep data
* @param step , Object , Steps data
*
* @return Collection , Data with each index
*/
module.exports.parseAll = function(limit, sleep, step){
    var response = {};

    if(sleep)
    {
        response["Sleep"] = parseDateData(sleep.items, function(a){ return parseFloat((a.duration / 3600).toFixed(2)); }, limit, false);
    }
    if(step)
    {
        response["Steps"] = parseDateData(step.items, function(a){return a.steps; }, limit, false);
    }

    return response;

};


/**
 * Parse the date data into per day records
 *
 * @param data     , Array    ,  Data for specific indicator
 * @param selector , Function ,  To select the required key from object with internal operation
 * @param noOfDays , Integer  ,  Number of days
 * @param tmpStmp  , Boolean  ,  Time Stamps are required or not
 */
var parseDateData = function(data, selector, noOfDays, tmpStmp){
    if(_.isEmpty(data)){
        return false;
    }

    //need to reverse, data start from last available time
    data.reverse();

    //if we want unfiltered data then
    if(_.isNumber(noOfDays)){
        var lastAccessDate = moment.unix(data[0].time_created).startOf('day').subtract(noOfDays, 'days').unix();
        data = _.filter(data, function(v){
            return (v.time_created >= lastAccessDate);
        });
    }
    var returns = {};
    var lastTime = {};
    console.log(":::::: Parsing Jawbone Data  ::::::::");

    data.forEach(function(val){
        val['quantity'] = selector(val.details);

        if(!tmpStmp)
        {
            var tmpKey = units.getFormattedDateFromUnix(val.time_created);
        }
        else {
            var tmpKey = units.getFormattedDateTimeUnix(val.time_created);
        }

        console.log(tmpKey, val['quantity']);

        var tmpTime = val.time_created;
        if(!returns[tmpKey]){
            returns[tmpKey] = val['quantity'];
            lastTime[tmpKey] = tmpTime;
        } else {
            if(moment.unix(val.time_created).isSame(moment.unix(lastTime[tmpKey]), 'day'))
            {
                //adding same date data
                returns[tmpKey] += val['quantity'];
                lastTime[tmpKey] = tmpTime;
            }
            else {
                returns[tmpKey] = val['quantity'];
                lastTime[tmpKey] = tmpTime;
            }
        }
    });

    return returns;
};
