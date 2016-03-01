'use strict';

var servicelist = require('../../../components/servicemap/servicelist');
var Q = require('q');
var _ = require('lodash');

//get required driver to run the service
var getDriver = function(serviceId){
    if(!servicelist.isServiceAvailable(serviceId)){ return false; }
    return require('../drivers/' + serviceId + '/index');
};


//start oauth process
exports.beginOauth = function(serviceId, callbackUrl){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .run(callbackUrl)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject("Driver not found");
    }

    return deferred.promise;

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


//get access token
exports.getAccessToken = function(serviceId, token, verifier, secret){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .getAccessToken(token, verifier, secret)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject("Driver not found");
    }

    return deferred.promise;

};


module.exports = exports;
