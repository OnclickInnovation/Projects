"use strict";
var _       = require('lodash');
var async   = require("async");
var moment  = require("moment");
var request = require('request');
var Q       = require('q');

var adapter = require('./adapter');
var masterAdapter = require('../base/master-adapter');

//get base url for api
var getAPIBaseUrl = function(url){
    url = url || '';
    return 'https://api.misfitwearables.com/' + url;
};

var redirectURL = getAPIBaseUrl() + "auth/dialog/authorize/";

//second which are added when checking for a token expiry.
var TokenExpiryOffset = 60;

var config = {};

var tokenConfig = require('./config')(process.env.NODE_ENV);
/** Configurables **/
config.client_id = tokenConfig.client_id;
config.client_secret = tokenConfig.client_secret;
config.scope = "session,sleeps";
config.apiUrl = getAPIBaseUrl();
config.authorization_url = "auth/dialog/authorize";
config.access_token_url = "auth/tokens/exchange";
config.resource_url = "move/resource/v1/user/me/activity";
/** Configurables Ends **/


//internal callback to parse the response from userauth calls
var userConversion = function(err, data, promise){
    if(err){
      promise.reject(err);
      return;
    } else {
        //if there is error in api
        if(data.error){
          promise.reject(data);
          return;
        }

        data = JSON.parse(data);

        var current_sec = parseInt((new Date()).getTime() / 1000);

        var resp = {
          access_token: data.access_token
        };

        promise.resolve(resp);
    }
};


// parse response from Misfit to see if there is any error or not
var asyncReqParser = function(body, cb){

   var error = {};
   try{
       error = JSON.parse(body);
   } catch(e) {
      cb(null, body);
      return;
   }
    //if there is error
    if(error.error_message){
      console.log("Rejected API Misfit ", error.error_message);
      cb(null, error);
    } else {
      cb(null, JSON.parse(body));
    }
};

//buil a url from data
var buildUrl = function(url, data, glue){

    url = url || '';
    glue = glue || '?';

    //prepare url
    var params = [];

    _.forEach(data, function(val, key){
        params.push(key + '=' + val);
    });

    return url + glue + params.join('&');

};


/** prepare a url where user should be redirected and begin the oauth **/
exports.run = function(callbackUrl, sessionTokenId){

    if(sessionTokenId){
         //sign the url with our session token so /handle/:serviceId can know origin user
         callbackUrl = buildUrl(callbackUrl, { 'state': sessionTokenId });
    }

    //this is all the data to be sent
    var data = {
        client_id: config.client_id,
        response_type: 'code',
        redirect_uri: callbackUrl,
        scope: config.scope
    };

    callbackUrl = buildUrl(redirectURL, data);

    return callbackUrl;
};

//get Access token from Misfit
exports.getAccessToken = function(code, callbackUrl){

    var deferred = Q.defer();
    var data = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: callbackUrl,
        client_id: config.client_id,
        client_secret: config.client_secret
    };
    callbackUrl = buildUrl(getAPIBaseUrl() + config.access_token_url, data);

    //since Misfit API is exposed by GET we can't use OauthV2's getAccessToken method
    request.post({url: callbackUrl, form: data}, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        userConversion(null, body, deferred);
      } else {
        userConversion(error, null, deferred);
      }
    });

    return deferred.promise;
};


/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData, callbackUrl){
  var deferred = Q.defer();

  var today = moment().format("YYYY-MM-DD").toString();
  var ago30Day = moment().subtract(30, "days").format("YYYY-MM-DD").toString();
  var baseUrl = getAPIBaseUrl(config.resource_url);

  var sleepUrl = baseUrl + '/sleeps?start_date=' + ago30Day + '&end_date=' + today;
  //`detail=true` to fetch per day steps
  var stepsUrl = baseUrl + '/summary?start_date=' + ago30Day + '&end_date=' + today + '&detail=true';
      async.parallel([
          function(cb){
            request({ url: sleepUrl, headers: {'access_token': oauthData.access_token} }, function (error, response, body) {
              asyncReqParser(body, cb);
            });
          },
          function(cb){
            request({ url: stepsUrl, headers: {'access_token': oauthData.access_token} }, function (error, response, body) {
              asyncReqParser(body, cb);
            });
          }
        ], function(err, results){
            //send errors back
            if(err){
              deferred.reject(err);
              return;
            }
            if(oauthData.all)
            {
              results = adapter.parseAll(results, oauthData.days);
            }
            else {
              results = adapter.parse(results, oauthData.days);
            }

            results = masterAdapter.buildAdapter(results, "Misfit", "Misfit's recent 30 days records.");

            deferred.resolve(results);
      });

  return deferred.promise;

};

module.exports = exports;
