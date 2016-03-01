'use strict';

var router = require('express').Router({mergeParams: true});
var _ = require('lodash');
var logger = require('logger');
var moment = require('moment');
var url = require('url');
var Errors = require('errors');
var Q = require('q');
var OauthMonitorTokenModel = require('models').OauthMonitorToken;
var MeasurementMonitorModel = require('models').MeasurementMonitor;
var MeasurementDTO = require('../../../../dto/measurement');
var MeasurementMonitorDTO = require('../../../../dto/mesurementMonitor');
var driver = require('../../../service/driver');
var jwt = require('../../../service/drivers/base/jwt');

var reader = require('./reader');

/**
* Get all the measurement map records for a monitorModel
*/
var measurementMarshaller = function(measurementMap){
    var measurementMonitor;
    var deffered = Q.defer();
    MeasurementMonitorDTO
    .marshal(measurementMap)
    .then(function(data){
            measurementMonitor = data;
            var measurement = MeasurementDTO.marshal(measurementMap.Measurement);
            measurementMonitor.name = measurement.name;
            measurementMonitor.unit = measurement.unit;
            deffered.resolve(measurementMonitor);
        }).catch(function(err){
            console.error('err', err);
            deffered.reject(err);
        });
    return deffered.promise;
};

router.get('/', function(req, res){
    req
    .monitorModel
    .getMeasurementMaps()
    .then(function(measurements){
        var final = [];
        measurements.forEach(function(measurementMap){
            final.push(measurementMarshaller(measurementMap));
        });
        return Q.all(final)
        .then(function(data){
            res.json(data);
        });
    })
    .catch(function(e){
        console.log(e);
        res.status(500);
        res.json(e.message);
    });
});

//put request for adding/updating measurements of a monitor
router.put('/', require('./put'));

/**
* Delete a single measurement of monitor
*
* @param :measurementId , Interger , MeasurementMonitorMap Table id to delete
*
*/
router.delete('/:measurementId', function(req,res){
    req
    .monitorModel
    .getMeasurementMaps()
    .then(function(measurements){
        if(measurements.length <= 1){
            throw new Errors.BadRequestError("Can't delete health indicator. At least one indicator is required.");
        }

        return MeasurementMonitorModel
        .destroy({
            where: {
                id: req.params.measurementId,
                monitor_id: req.monitorModel.id
            }
        })
        .then(function(data){
            return res.send(true);
        });
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send(err);
    });
});

/**
* Add oauth data to a measurement map table by finding it based on its measurmentId
* Set next reading and other flag based on oauth data
*
* @param measurmentId , Interger, Measurment id (glucose) for which oauth data will be added
*/
router.put('/:monitorMeasurementId', function(req, res){
    var measurementId = req.params.monitorMeasurementId;
    var urlParsed = url.parse(req.url, true);
    var monitorId = req.params.monitorId;
    var monitor = req.monitorModel;
    var data = req.body;
    var updateOauthOnly = urlParsed.query.oauthUpdateOnly;
    if(_.isEmpty(data.service_name)){
        return res.status(400).send("Service data not supplied");
    }

    //get all the measurements for the monitor
    if(_.isEmpty(monitor)){
        return res.status(404).send("Monitor not found");
    }

    monitor
    .getMeasurementMaps(measurementId)
    .then(function(measurement){
        measurement = measurement[0];
        if(_.isEmpty(measurement)){
            return res.status(404).send("Monitor Measurement link not found");
        }

        //decode the data if its encoded
        var oauthData = jwt.decode(data.oauth_data);
        OauthMonitorTokenModel.find({
            where: {
                monitor_id: monitorId,
                service_name: data.service_name
            }
        }).then(function(dataVal){
            if(!dataVal){
                if(_.isEmpty(data.service_name) || _.isEmpty(data.oauth_data)){
                    return res.status(400).send("Service data not supplied");
                }
                return OauthMonitorTokenModel.create({
                    service_name: data.service_name || null,
                    oauth_data: _.isEmpty(oauthData) ? null : JSON.stringify(oauthData)
                }).then(function(oauthDataRes){
                    oauthData = oauthDataRes.oauth_data ? JSON.parse(oauthDataRes.oauth_data) : null;
                    return oauthDataRes.setMonitor(monitorId).then(function(){
                        return measurement.setOauthMonitorToken(oauthDataRes.id);
                    });
                });
            }else{
                oauthData = dataVal.oauth_data ? jwt.decode(dataVal.oauth_data) : null;
                return measurement.setOauthMonitorToken(dataVal.id);
            }
        })
        .then(function(){
            //updated token , now return response
            if(updateOauthOnly){
                console.log("Update only oauth data");
                return res.status(200).json(true);
            }

            var callback = function(error, results){
                if(error){
                    console.log(results, error);
                    res.status(401).json(results);
                } else {

                    if(_.isEmpty(results.data)){
                        results.data = null;
                        return res.status(422).send("Unable to fetch any data from service");
                    }

                    //get latest reading and its date
                    var readingObj = reader(measurement.Measurement, data.service_name, results, false);
                    //if cant read response
                    if(_.isEmpty(readingObj))
                    {
                        logger.warn("Monitor try to read data which we dont support. Reader wasn't able to read service response");
                        logger.debug("MeasurementMonitor Id was " + measurement.id);
                        return res.status(422).send("Unable to fetch required data from service. Please unlink and reconnect Synsormed then retry.");
                    }

                    var readingDate = readingObj.date;
                    var reading = readingObj.reading;

                    //convert to string
                    reading = reading ? reading.toString() : null;

                    //check if readingDate from server and measurement date are in correct order
                    var lowest_allowed_reading_date = moment(measurement.next_reading)
                    .startOf('day')
                    .subtract(measurement.repeat_within_seconds, 'seconds');
                    logger.debug('MeasurmentMonitor ' + measurement.id + ' : Lowest allowed date for the reading is ' + lowest_allowed_reading_date.toString());
                    logger.debug('We are reading for ' + readingDate);
                    logger.debug('Repeat interval was ' + measurement.repeat_within_seconds);

                    //if the reading Date is below the required date then return
                    // we will report the user that we need new reading
                    if(lowest_allowed_reading_date.isAfter(moment(readingDate, 'D MMM YYYY'), 'day')){
                        var errorMessage = "Please sync your device with more recent data. Last reading was on: " + readingDate;
                        switch(data.service_name){
                            case "ihealth":
                            errorMessage = "Please sync your iHealth device with more recent data. Last reading was on: " + readingDate;
                            break;

                            default:
                        }

                        return res.status(422).send(errorMessage);
                    }

                    measurement
                    .updateAttributes({
                        latest_reading: reading
                    })
                    .then(function(){
                        //reset monitor's next reading date taking today as base
                        return measurement.setNextRecordingTime(new Date());
                    })
                    .then(function(){
                        return measurement.updateAttributes({
                            last_recorded: new Date()
                        });
                    })
                    .then(function(){
                        res.status(200).send();
                    })
                    .catch(function(e){
                        logger.error(e);
                        res.status(500).json(e);
                    });

                }
            };

            //model instance to update in OAuth2 case
            if(measurement.oauth_id)
            {
                    oauthData.oauthModelInstance = measurement.OauthMonitorToken;
            }
            else {
                    oauthData.oauthModelInstance = measurement;
            }

            oauthData.all = true;
            // console.log(data.service_name, oauthData);
            //fetch the user profile information
            driver.getUserDetails(data.service_name, oauthData)
            .then(function(results){
                callback(null, results);
            }).catch(function(err){
                console.error(err);
                callback(true, err);
            });
        });

    })
    .catch(function(e){
        logger.error(e);
        res.status(500).json(e);
    });

});

router.use('/:measurementId/insights', require('./insights.js'));

module.exports = router;
