"use strict";
var _ = require('lodash');
var servicelist = require('../../components/servicemap/servicelist');
var Q = require('q');

exports.getAuthDriver = function(version){

  if(version === 1){
    return require('./oauthv1/auth');
  } else if(version === 2){
    return require('./oauthv2/auth');
  } else if(version === 0){
    return require('./raw/auth');
  }

};

exports.getUserDetails = function(serviceId, oauthData){
  var deferred = Q.defer();
  var service = servicelist.getService(serviceId);

  if(_.isEmpty(service)){
      deferred.reject("Service not found");
      return deferred.promise;
    }

    var AuthDriver = exports.getAuthDriver(service.version);
    var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId);

    switch (service.version) {
      case 1:
        AuthDriver.getUserProfile(serviceId, oauthData)
        .then(deferred.resolve)
        .catch(deferred.reject);
        break;
      case 2:
        AuthDriver.getUserProfile(serviceId, oauthData, callbackUrl)
        .then(deferred.resolve)
        .catch(deferred.reject);
        break;
      case 0:
        AuthDriver.getUserProfile(serviceId, oauthData)
        .then(deferred.resolve)
        .catch(deferred.reject);
        break;
    }

  return deferred.promise;

};
