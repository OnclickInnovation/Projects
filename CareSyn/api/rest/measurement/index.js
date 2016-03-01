'use strict';

var router = require('express').Router();

var MeasurementModel = require('models').Measurement;
var MeasurementDTO = require('../../../dto/measurement');


router
.get('/', function(req, res){

  //for now only glucose is needed
  MeasurementModel.findAll({
      where: {
        name: {
          $in: ['glucose', 'blood pressure', 'steps', 'weight', 'sleep']
        }
    }
  }).then(function(measurements){
      var final = [];

      measurements.forEach(function(data){
          final.push(MeasurementDTO.marshal(data));
      });

      res.json(final);
  });

});

module.exports = router;
