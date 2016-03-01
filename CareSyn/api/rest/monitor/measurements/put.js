'use strict';

var router = require('express').Router({mergeParams: true});
var Q = require('q');
var logger = require('logger');
var _ = require('lodash');
var MeasurementMonitorDTO = require('../../../../dto/mesurementMonitor');
var MeasurementMonitorModel = require('models').MeasurementMonitor;


var setNextRecording = require('../../../../rules/monitor').setNextRecording;

router.put('/', function(req, res){
    if(!req.body){
        //empty measurements
        res.status(500).send('Empty');
    }

    var arr = [];

    req.body.forEach(function(measurementJson){
        arr.push(updater(measurementJson, req.monitorModel));
    });

    Q.all(arr)
    .then(function(){
        res.send(true);
    })
    .catch(function(e){
        console.error(e);
        res.status(500).json(null);
    });
});

//function to marshal and update/create measurement
var updater = function(measurementJson, monitor){
    var monitorMeasurement = MeasurementMonitorDTO.unmarshal(measurementJson);
    var deffered = Q.defer();

    MeasurementMonitorModel
    .findOne({
        where: {
            id: monitorMeasurement.id,
            monitor_id: monitor.id
        }
    })
    .then(function(mapInstance){
        //monitorMeasurement - marshalled data from portal
        if(mapInstance){
            var resetRepeat = monitorMeasurement.repeat_within_seconds
              ? mapInstance.repeat_within_seconds !== monitorMeasurement.repeat_within_seconds
              : false;

            var resetMeasurement = monitorMeasurement.measurement_id
              ? mapInstance.measurement_id !== monitorMeasurement.measurement_id
              : false;

            //if the measurement type is updated, dont reset when undefined
            if(resetMeasurement){
                monitorMeasurement.latest_reading = null;
            }
            return mapInstance.update(monitorMeasurement).then(function(mapInstance){
                  if(resetRepeat || resetMeasurement){
                    logger.debug("Resetting the next reading due to change in repeat interval or change in monitor type");
                     return mapInstance.resetNextReading().then(function(){
                          deffered.resolve();
                      });
                  } else {
                    deffered.resolve();
                  }
          });
        } else {
            console.log("Adding measurement");
            monitorMeasurement.monitor_id = monitor.id;
            monitorMeasurement.next_reading = setNextRecording(new Date(), new Date(), monitorMeasurement.repeat_within_seconds);

            // Created New Measurement
            return monitor
                    .addMeasurements([monitorMeasurement.measurement_id], monitorMeasurement)
                    .then(function(measurementMap){

                        // TODO: Bug in Sequelize https://github.com/sequelize/sequelize/issues/3455
                        if(_.isNumber(measurementMap[0][0])){
                            console.log("Manually adding MeasurementMonitor record on update");
                            return MeasurementMonitorModel
                            .create(monitorMeasurement)
                            .then(function(){
                                deffered.resolve();
                            });
                        } else {
                            console.log("MeasurementMonitor record on added");
                            deffered.resolve();
                        }
                    });
        }
    })
    .catch(function(err){
        console.error(err);
        deffered.reject(err);
    });

    return deffered.promise;
};

module.exports = router;
