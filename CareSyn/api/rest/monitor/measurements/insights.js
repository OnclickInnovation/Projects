"use strict";
var router = require('express').Router({mergeParams: true});
var _ = require('lodash');
var reader = require('./reader');
var driver = require('../../../service/driver');
var units = require('../../../service/drivers/base/units');
var measurementDto = require('../../../../dto/measurement');
var moment = require('moment');

router.get('/', function(req, res){
    var measurementId = req.params.measurementId;
    var monitor = req.monitorModel;

    monitor
    .getMeasurementMaps(measurementId)
    .then(function(measurementMap){
        var measurementUnits;
        measurementMap = measurementMap[0];
        measurementUnits = measurementDto.marshal(measurementMap.Measurement);
        if(_.isEmpty(measurementMap)){
            return res.status(404).send("Monitor Measurement link not found");
        }
        measurementMap
        .getAuthData()
        .then(function(data){
            if(!data)
            {
                return res.status(404).send("No service linked");
            }
            var oauthData = JSON.parse(data.oauth_data);
            var service_name = data.service_name;
            if(!oauthData)
            {
                return res.status(422).send("Unable to fetch any auth data from service");
            }
            //model instance to update in OAuth2 case
            var callback = function(error, results){

                if(error){
                    console.log(error, results);
                    return res.status(401).json(results);
                }

                if(_.isEmpty(results.data)){
                    results.data = null;
                    return res.status(422).send("Unable to fetch any data from service");
                }
                var data = reader(measurementUnits, service_name, results, true);
                if(_.isEmpty(data)){
                    return res.status(409).send("Unable to fetch required data from service.");
                }

                var dates = Object.keys(data), finalObj;

                if(_.isEmpty(dates)){
                    return res.status(422).send("Unable to fetch required data from service.");
                }

                //sort the dates
                dates = dates.map(function(a){
                    var tempObj = {
                        date: a,
                        unix: units.getUnixFromFormattedDateTime(a)
                    };
                    return tempObj;
                });

                dates.sort(function(a, b){
                    return a.unix < b.unix ? -1 : 1;
                });

                dates = dates.map(function(a){
                    return a.date;
                });
                var newDates = [];
                if(measurementUnits.name.toLowerCase() == 'steps' || measurementUnits.name.toLowerCase() == 'sleep')
                {
                    dates.forEach(function(date){
                        newDates.push(moment(date,'D-MMM-YYYY HH:mm:ss').format('D MMM YYYY').toString());
                    });
                }
                else {
                    dates.forEach(function(date){
                        newDates.push(moment(date, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'));
                    });
                }
                var seriesData = [], diastolicData = [];
                //measurement = measurementDto.marshal(measurement);
                if(measurementUnits.name.toLowerCase() == 'blood pressure')
                {
                    dates.forEach(function(entry){
                        var arr = data[entry].split('/');
                        seriesData.push({
                            y: parseInt(arr[0]),
                            extra: {
                                reading: arr[0],
                                name: measurementUnits.name + ' (SP)',
                                unit: measurementUnits.unit
                            }
                        });
                        diastolicData.push({
                            y: parseInt(arr[1]),
                            extra: {
                                reading: arr[1],
                                name: measurementUnits.name + ' (DP)',
                                unit: measurementUnits.unit
                            }
                        });
                    });
                    finalObj = {categories: newDates, series1: seriesData, series2: diastolicData};
                }
                else if(measurementUnits.name.toLowerCase() == 'sleep')
                {

                    dates.forEach(function(entry){
                        var tempDate = data[entry];
                        var time = moment.duration(data[entry] * 3600, 'seconds');
                        if(time.minutes()){
                            if(time.minutes() < 10)
                            {
                                data[entry] = time.hours() + ':' + '0' +time.minutes();
                            }
                            else
                            {
                                data[entry] = time.hours() + ':' +time.minutes();
                            }
                        }
                        else {
                            data[entry] = time.hours();
                        }

                        seriesData.push({
                            y: parseInt(tempDate),
                            extra: {
                                reading: data[entry],
                                name: measurementUnits.name,
                                unit: measurementUnits.unit
                            }
                        });
                    });

                    finalObj = {categories: newDates, series1: seriesData};
                }
                else {
                    dates.forEach(function(entry){
                        seriesData.push({
                            y: parseInt(data[entry]),
                            extra: {
                                reading: data[entry],
                                name: measurementUnits.name,
                                unit: measurementUnits.unit
                            }
                        });
                    });

                    finalObj = {categories: newDates, series1: seriesData};
                }

                return res.send(finalObj);

            };

            if(measurementMap.oauth_id)
            {
                    oauthData.oauthModelInstance = measurementMap.OauthMonitorToken;
            }
            else {
                    oauthData.oauthModelInstance = measurementMap;
            }

            oauthData.days = 10;
            oauthData.all = true;

            //fetch the user profile information
            driver.getUserDetails(service_name, oauthData)
            .then(function(results){
                callback(null, results);
            }).catch(function(err){
                console.error(err);
                callback(true, err);
            });
        });
        /*if(_.isEmpty(measurement.MeasurementMonitor.oauth_data) || _.isEmpty(measurement.MeasurementMonitor.service_name)){
        return res.status(422).send("Monitor is not connected with Oauth service");
    }*/
}).catch(function(e){
    console.log(e);
    return res.status(500).json(e);
});

});


module.exports = router;
