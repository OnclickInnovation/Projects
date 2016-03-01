"use strict";
var _ = require('lodash');
var Q = require('q');
var reqMock = require('../reqmock');
var ServiceModel = require('models').Service;

var serviceBaseUrl = '/v1/service';
var services = {};

/**
* Bind services
*
* @return Promise
*/
exports.bindServices = function(){
    var deferred = Q.defer();

    //bootup , get all the services
    ServiceModel.findAll().then(function(list){
        list.forEach(function(d){
            services[d.name] = d.toJSON();
            deferred.resolve();
        });
    }).catch(deferred.reject);

    return deferred.promise;
};

/** Get base url for the services
*
* @param Stream Request Object
*
*/
var getServiceBaseUrl = function(){
    return reqMock.protocol + '://' + reqMock.get('host') + serviceBaseUrl;
};


/**
* Get call back url for a service
*
* @param String serviceId , the service id
* @param String sevicesUrlBase , base url for the services
* @param String version , the service version
* @param String fullUrl , need full url or not
*
*/
var getCallbackUrl = function(serviceId, sevicesUrlBase, version, fullUrl){
    return (fullUrl === true) ?
    (sevicesUrlBase + "/v" + version + "/handle/" + serviceId)
    : ("/v" + version + "/handle/" + serviceId);
};

/**
* Get auth url for service, here user should be redirected to begin oauth
*
* @param String serviceId , the service id
* @param String sevicesUrlBase , base url for the services
* @param String version , the service version
*
*/
var getAuthUrl = function(serviceId, sevicesUrlBase, version){
    return sevicesUrlBase + "/v" + version + "/auth/" + serviceId;
};


/**
* Get all the active services with version 1 or above
*
* @param Boolean all , get all the services regardless of version
*
*/
exports.getServices = function(all){

    //by default all is false
    all = all || false;

    var list = {};

    //loop over services
    _.forEach(services, function(service, serviceId){

        //ignore oauth less
        if(!all && parseInt(service.version) === 0){
            return;
        }
        list[serviceId] = exports.getService(serviceId);
    });

    return list;
};

/**
* Get a single service construct
*
* @param String id , the service name
*
*/
exports.getService = function(id){

    var baseUrl = getServiceBaseUrl();
    var service = services[id];
    if(_.isEmpty(service)){
        deffered.resolve(false);
    }
    return {
        display: service.display,
        title: service.display,
        name: service.name,
        description: service.description,
        url: service.url,
        version: parseInt(service.version),
        apiUrl: getAuthUrl(id, baseUrl, service.version),
        callback: getCallbackUrl(id, baseUrl, service.version)
    };
};

//if a service is available
exports.isServiceAvailable = function(serviceId){
    return (_.isEmpty(services[serviceId])) ? false : true;
};


exports.getCallbackUrlByServiceId = function(serviceId){

    var baseUrl = getServiceBaseUrl();

    var service = services[serviceId];

    if(_.isEmpty(service)){
        return false;
    }

    return getCallbackUrl(serviceId, baseUrl, service.version, true);

};

/** Add get param to a url safely **/
exports.addGetParams = function(url, params){
    url = _.trimRight(url, ['/']);

    if(!params){
        return url;
    }

    url = url + '?';

    _.forEach(params, function(v, k){
        url += k + '=' + v + '&';
    });

    url = _.trimRight(url, ['&']);

    return url;
};
