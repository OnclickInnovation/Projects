'use strict';

var router = require('express').Router({mergeParams: true});
var _ = require('lodash');

var MeasurementModel = require('models').Measurement;
var ServiceModel = require('models').Service;
var servicelist = require('../../../components/servicemap/servicelist');
var oauthMonitorDto = require('../../../dto/oauthMonitorToken');

router.get('/', function(req, res){
    ServiceModel.findAll({
        include: [{
            model: MeasurementModel,
            where: {
                id: req.query.measurementId
            }
        }]
    })
    .then(function(services){

        if(_.isEmpty(services)){
            return res.json([]);
        }

        var final = [];

        services.forEach(function(d){
            final.push(servicelist.getService(d.name));
        });

        res.json(final);

    });

});

router.get('/connected', function(req, res){
    var monitor = req.monitorModel;

    // monitor
    // .getMeasurements()
    monitor.getOauthMonitorTokens()
    .then(function(measurements){
        if(!measurements){
            return res.status(404).send("Monitor has no measurements link");
        }
        var arr = [];
        measurements.forEach(function(val){
            arr.push(oauthMonitorDto.marshal(val));
        });
        return res.json(arr);
    })
    .catch(function(e){
        return res.status(500).json(e);
    });
});

module.exports = router;
