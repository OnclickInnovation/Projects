'use strict';

var servicelist = require('../../../components/servicemap/servicelist');
var _ = require('lodash');
var Q = require('q');

//get required driver to run the service
var getDriver = function(serviceId){
    if(!servicelist.isServiceAvailable(serviceId)){ return false; }
    return require('../drivers/' + serviceId + '/index');
};


//get profile from a service
exports.getUserProfile = function(serviceId, oauthData){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .profile(oauthData)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject("Driver not found");
    }

    return deferred.promise;

};

module.exports = exports;
