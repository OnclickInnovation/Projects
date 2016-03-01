'use strict';

var Q = require('q');
var _ = require('lodash');

var models = require('models');
var MeasurementModel = models.Measurement;
var ServiceModel = models.Service;
var MeasurementServiceModel = models.MeasurementService;

var driverReader = require('../../api/service/drivers');

//link a service with its measurement
exports.linkServiceMeasurement = function(services){

  var promises = [];

  services.forEach(function(service){

      var tempPromise = Q.defer();
      var tempService = _.omit(service, 'provides');
      tempService.version = tempService.version.toString();

      ServiceModel
        //remove the provides key from services
        .findOrCreate({where: tempService})
        .then(function(serviceObj){

            if(_.isEmpty(serviceObj)) {
              tempPromise.resolve();
              return;
            }

            //find
            MeasurementModel.findAll({
                where: {
                  name: {
                    '$in': service.provides
                  }
                }
            })
            .then(function(measurements){

              if(_.isEmpty(measurements)) {
                tempPromise.resolve();
                return;
              }

              serviceObj[0].setMeasurements(measurements).then(function(){
                tempPromise.resolve();
              })
              .catch(function(e){
                tempPromise.reject(e);
              });

            })
            .catch(function(e){
              tempPromise.reject(e);
            });
        })
        .catch(function(e){
          tempPromise.reject(e);
        });

        promises.push(tempPromise.promise);
    });

  return Q.all(promises);
};

//Read measurement from configuration file
exports.getMeasurements = function(){
  var deferred = Q.defer();
  var filePath = require('path').join(__dirname, 'measurements.json');

  require('fs').readFile(filePath, 'utf8', function(err, data){
    if(err){
      deferred.reject(err);
    } else {
      deferred.resolve(JSON.parse(data));
    }
  });

  return deferred.promise;
};

// Reinit the database with new measurement and service entries
exports.resetDatabase = function(measurements, services){

    var deferred = Q.defer();

    //Clean the tables
    Q.all([
      MeasurementServiceModel.destroy({truncate: true}),
      ServiceModel.destroy({truncate: true}),
      MeasurementModel.destroy({truncate: true})
    ]).then(function(){
      //regenerate them again
      return Q.all([
        ServiceModel.sync(),
        MeasurementModel.sync(),
        MeasurementServiceModel.sync()
      ]);
    })
    .then(function(){
      //add new records
      return Q.all([
        MeasurementModel.bulkCreate(measurements),
        ServiceModel.bulkCreate(services)
      ]);
    })
    .then(function(){
      deferred.resolve();
    })
    .catch(function(e){
      deferred.reject(e);
    });

    return deferred.promise;

};

/* Bootstrap the Service and Measurements */
exports.setupServicesMap = function(){
  var deferred = Q.defer();

  Q.all([exports.getMeasurements(), driverReader.readServices()])
   .spread(function(measurements, services){
     return exports.resetDatabase(measurements, services)
     .then(function(){
       return exports.linkServiceMeasurement(services);
     });
  })
  .then(function(){
    deferred.resolve();
  })
  .catch(function(e){
    deferred.reject(e);
  });

  return deferred.promise;
};
