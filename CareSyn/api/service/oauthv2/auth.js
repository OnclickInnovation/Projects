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
exports.beginOauth = function(serviceId, callbackUrl, callback, sessionTokenId){

    var driver = getDriver(serviceId);

    if(driver !== false){

      callbackUrl = driver.run(callbackUrl, sessionTokenId);

      callback(callbackUrl);

    } else {
      return false;
    }

};

/**
 * get profile from a service
 *
 *  oauthData.modelInstance : used to updated the Oauth Info chnage like access token,
 *  new changes will be updated to this modelInstance
 *
 * oauthData.days : Days for which records will be parsed
 *
 */
exports.getUserProfile = function(serviceId, oauthData, callbackUrl){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .profile(oauthData, callbackUrl)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
        deferred.reject('Driver not found');
    }

    return deferred.promise;

};


//get access token
exports.getAccessToken = function(serviceId, code, callbackUrl){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .getAccessToken(code, callbackUrl)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject("Driver not found");
    }

    return deferred.promise;

};


//check if oauth data is expired or not
exports.expireCheck = function(serviceId, oauthData, callbackUrl){

    var deferred = Q.defer();
    var driver = getDriver(serviceId);

    if(!_.isEmpty(driver)){

      driver
        .expireCheck(oauthData, callbackUrl)
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      deferred.reject("Driver not found");
    }

    return deferred.promise;

};



module.exports = exports;
