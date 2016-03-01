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
    return 'https://api.ihealthlabs.com:8443/' + url;
};

var redirectURL = getAPIBaseUrl() + "OpenApiV2/OAuthv2/userauthorization/";

//second which are added when checking for a token expiry.
var TokenExpiryOffset = 60;

var config = {};

var tokenConfig = require('./config')(process.env.NODE_ENV);
/** Configurables **/
config.client_id = tokenConfig.client_id;
config.client_secret = tokenConfig.client_secret;
config.scope = "OpenApiBG OpenApiBP OpenApiSpO2 OpenApiWeight OpenApiActivity";
config.apiUrl = getAPIBaseUrl();
config.authorization_url = "OpenApiV2/OAuthv2/userauthorization";
config.access_token_url = "OpenApiV2/OAuthv2/userauthorization";
config.refresh_token_url = "OpenApiV2/OAuthv2/userauthorization";
config.SC = tokenConfig.SC;

//these codes are sent by iHealth in the email
var SV = {};

SV.OpenApiBP       = tokenConfig.SV.OpenApiBP;
SV.OpenApiBG       = tokenConfig.SV.OpenApiBG;
SV.OpenApiSpO2     = tokenConfig.SV.OpenApiSpO2;
SV.OpenApiWeight   = tokenConfig.SV.OpenApiWeight;
SV.OpenApiActivity   = tokenConfig.SV.OpenApiActivity;
SV.OpenApiUserInfo = tokenConfig.SV.OpenApiUserInfo;

/** Configurables Ends **/


//internal callback to parse the response from userauth calls
var userConversion = function(err, data, promise){
    if(err){
      promise.reject(err);
      return;
    } else {
        data = JSON.parse(data);

        //if there is error in api
        if(data.Error){
          promise.reject(data);
          return;
        }

        var current_sec = parseInt((new Date()).getTime() / 1000);

        var resp = {
          access_token: data.AccessToken,
          refresh_token: data.RefreshToken,
          expires: current_sec + data.Expires,
          refresh_token_expires: current_sec + data.RefreshTokenExpires,
          user_id: data.UserID
        };

        promise.resolve(resp);
    }
};


// parse response from iHealth to see if there is any error or not
var asyncReqParser = function(body, cb){

   var error = {};

   try{
       error = JSON.parse(body);
   } catch(e) {
      cb(null, body);
      return;
   }

    //if there is error
    if(error.ErrorCode){
      console.log("Rejected API iHealth ", error);
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
        APIName: config.scope
    };

    callbackUrl = buildUrl(redirectURL, data);

    return callbackUrl;
};

//get Access token from iHealth
exports.getAccessToken = function(code, callbackUrl){

    var deferred = Q.defer();

    var data = {
      client_id: config.client_id,
      client_secret: config.client_secret,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl,
      code: code
    };

    callbackUrl = buildUrl(redirectURL, data);

    //since iHealth API is exposed by GET we can't use OauthV2's getAccessToken method

    request(callbackUrl, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        userConversion(null, body, deferred);
      } else {
        userConversion(error, null, deferred);
      }
    });

    return deferred.promise;
};


//get Access token from iHealth using refresh token
exports.getAccessTokenViaRefreshToken = function(refresh_token, uid, callbackUrl){

  var deferred = Q.defer();

  var data = {
    client_id: config.client_id,
    client_secret: config.client_secret,
    redirect_uri: callbackUrl,
    refresh_token: refresh_token,
    response_type: 'refresh_token',
    UserID: uid
  };

  callbackUrl = buildUrl(redirectURL, data);

  //since iHealth API is exposed by GET we can't use OauthV2's getRefreshToken method

  request(callbackUrl, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      userConversion(null, body, deferred);
    } else {
      userConversion(error, null, deferred);
    }
  });

  return deferred.promise;

};

//check if a token is expired or not
exports.tokenExpired = function(token_unix){

    var current_sec = parseInt((new Date()).getTime() / 1000);

    //check if the token  are going to expire in next minute
    return ((current_sec + TokenExpiryOffset) > token_unix);

};

//check if token expired , perform regain of token and update it to model
exports.ensureAccessToken = function(oauthData, callbackUrl){

  var deferred = Q.defer();

  //if access token is expired
  if(exports.tokenExpired(oauthData.expires)){

      //check if refresh token working
      if(exports.tokenExpired(oauthData.refresh_token_expires)){
        console.log("Refresh token is expired for iHealth");
        deferred.reject(null);
      } else {
        console.log("Getting new access token for iHealth");
        //request for new access tokens
        exports.getAccessTokenViaRefreshToken(oauthData.refresh_token, oauthData.user_id, callbackUrl)
               .then(function(resp){
                   //we have some new data need to update to model
                   oauthData
                   .oauthModelInstance
                   .updateAttributes({
                       oauth_data : JSON.stringify(resp)
                     }).then(function(){
                       deferred.resolve(resp.access_token);
                     }).catch(function(e){
                       deferred.reject(e);
                     });
               })
               .catch(function(e){
                 deferred.reject(e);
               });
      }

  } else {
    console.log("Using old access token for iHealth");
    deferred.resolve(oauthData.access_token);
  }

  return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData, callbackUrl){

  var deferred = Q.defer();

  var userid = oauthData.user_id;

  var bpUrl = getAPIBaseUrl("openapiv2/user/" + userid + "/bp/?sv=" + SV.OpenApiBP);
  var glucoseUrl = getAPIBaseUrl("openapiv2/user/" + userid + "/glucose/?sv=" + SV.OpenApiBG);
  var oxygenUrl = getAPIBaseUrl("openapiv2/user/" + userid + "/spo2/?sv=" + SV.OpenApiSpO2);
  var weightUrl = getAPIBaseUrl("openapiv2/user/" + userid + "/weight/?sv=" + SV.OpenApiWeight);
  var activityUrl = getAPIBaseUrl("openapiv2/user/" + userid + "/activity/?sv=" + SV.OpenApiActivity);
  //test token and get data
  exports.ensureAccessToken(oauthData, callbackUrl)
  .then(function(access_token){
      var data = {
        client_id: config.client_id,
        client_secret: config.client_secret,
        access_token: access_token,
        sc: config.SC,
        locale: 'en_US'
      };

      var params_string = buildUrl(null, data, '&');

      bpUrl = bpUrl + params_string;
      glucoseUrl = glucoseUrl + params_string;
      oxygenUrl = oxygenUrl + params_string;
      weightUrl = weightUrl + params_string;
      activityUrl = activityUrl + params_string;
      async.parallel([
          function(cb){
            request(bpUrl, function (error, response, body) {
              asyncReqParser(body, cb);
            });
          },
          function(cb){
            request(glucoseUrl, function (error, response, body) {
              asyncReqParser(body, cb);
            });
          },
          function(cb){
            request(oxygenUrl, function (error, response, body) {
              asyncReqParser(body, cb);
            });
          },
          function(cb){
            request(weightUrl, function (error, response, body) {
              asyncReqParser(body, cb);
            });
          },
          function(cb){
            request(activityUrl, function (error, response, body) {
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
              results = adapter.parseAll(oauthData.days, results[0], results[1], results[2], results[3], results[4]);
            }
            else {
              results = adapter.parse(oauthData.days, results[0], results[1], results[2], results[3], results[4]);
            }

            results = masterAdapter.buildAdapter(results, "iHealth", "From iHealth's 50 recent records.");

            deferred.resolve(results);
      });
  })
  .catch(function(e){
      deferred.reject(e);
  });

  return deferred.promise;

};

/** check if oAuthdata is expired or not **/
exports.expireCheck = function(oauthData, callbackUrl){
  var deferred = Q.defer();

  var userid = oauthData.user_id;
  var bpUrl = getAPIBaseUrl("openapiv2/user/" + userid + "/bp/?sv=" + SV.OpenApiBP);

  //test token and get data
  exports.ensureAccessToken(oauthData, callbackUrl)
  .then(function(access_token){
      var data = {
        client_id: config.client_id,
        client_secret: config.client_secret,
        access_token: access_token,
        sc: config.SC,
        locale: 'en_US'
      };

      var params_string = buildUrl(null, data, '&');

      bpUrl = bpUrl + params_string;

      request(bpUrl, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          body = JSON.parse(body);

          if(body.Error && _.includes([4001, 4002], body.ErrorCode)){
            deferred.resolve(false);
            return;
          }
          deferred.resolve(true);
        } else {
          deferred.reject(false);
        }
      });

  })
  .catch(function(e){
      deferred.reject(e);
  });

  return deferred.promise;

};

module.exports = exports;
