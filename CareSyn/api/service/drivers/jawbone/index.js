'use strict';

var
_ = require('lodash'),
async = require("async"),
request = require('request'),
Q = require('q'),
moment = require('moment');

var adapter = require('./adapter');
var masterAdapter = require('../base/master-adapter');

//get base url for api
var getAPIBaseUrl = function(url){
    url = url || '';
    return 'https://jawbone.com/nudge/api/v.1.1/users/@me' + url;
};

var redirectURL = "https://jawbone.com/auth/oauth2/auth";

//second which are added when checking for a token expiry.
var TokenExpiryOffset = 60;

var config = {};

var tokenConfig = require('./config')(process.env.NODE_ENV);

/** Configurables **/

config.client_id = tokenConfig.client_id;
config.client_secret = tokenConfig.client_secret;
config.scope = "basic_read extended_read move_read weight_read heartrate_read sleep_read";
config.apiUrl = getAPIBaseUrl();
config.authorization_url = "https://jawbone.com/auth/oauth2/auth";
config.access_token_url = "https://jawbone.com/auth/oauth2/token";
config.refresh_token_url = "https://jawbone.com/auth/oauth2/token";

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
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires: current_sec + data.expires_in
        };

        if(!resp.access_token || !resp.refresh_token){
            promise.reject(new Error("OAuth token not returned by API"));
            return;
        }

        promise.resolve(resp);
    }
};

var asyncReqParser = function(body, cb){

   var error = {};

   try{
       error = JSON.parse(body);
   } catch(e) {
      cb(null, body);
      return;
   }

    //if there is error from Jawbone side
    if(error.meta.error_type){
      console.log("Rejected API Jawbone ", error);
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

var generateDataRequestUrl = function(url, accessToken){
    return {
        url: url + '?limit=500&start_time=' + parseInt(moment().subtract(30, 'days').unix()) + '&end_time=' + parseInt(moment().unix()),
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    };
};

var refershTokenRequestParams = function(url, formData){
    return {
        url: url,
        formData: formData
    };
};

var addHttpsToUrl = function(url){
    //JawBones work with https only
    if(process.env.NODE_ENV !== 'development'){
        url = 'https' + url.slice(4);
        return url;
    } else {
        return url;
    }

};

/** prepare a url where user should be redirected and begin the oauth **/
exports.run = function(callbackUrl, sessionTokenId){

    callbackUrl = addHttpsToUrl(callbackUrl);

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

//get Access token from Jawbone
exports.getAccessToken = function(code, callbackUrl){
    console.log("Getting Access Token for Jawbone");
    var deferred = Q.defer();

    var data = {
      client_id: config.client_id,
      client_secret: config.client_secret,
      grant_type: 'authorization_code',
      code: code
    };

    callbackUrl = buildUrl(config.access_token_url, data);

    request(callbackUrl, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        userConversion(null, body, deferred);
      } else {
        deferred.reject(error);
      }
    });

    return deferred.promise;
};


//get Access token from Jawbone using refresh token
exports.getAccessTokenViaRefreshToken = function(refresh_token, callbackUrl){
  console.log("Refreshing Token for Jawbone");
  var deferred = Q.defer();
  var data = {
    client_id: config.client_id,
    client_secret: config.client_secret,
    grant_type: 'refresh_token',
    refresh_token: refresh_token
  };
  callbackUrl = addHttpsToUrl(callbackUrl);
  request.post( refershTokenRequestParams(config.access_token_url, data), function (error, response, body) {
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
  request.get( generateDataRequestUrl(getAPIBaseUrl("/sleeps"), oauthData.access_token), function (error, response, body) {
     if (!error && response.statusCode === 200) {
         console.log('Using Old JawBone Token');
         deferred.resolve(oauthData.access_token);
     }
     else if(!error && response.statusCode === 401)
     {
         console.log('Requesting New JawBone Token');
         exports
         .getAccessTokenViaRefreshToken(oauthData.refresh_token, callbackUrl)
         .then(function(authData){
             console.log('Got New JawBone Token');
             //we have some new data need to update to model
              oauthData
              .oauthModelInstance
              .updateAttributes({
                  oauth_data: JSON.stringify(authData)
                })
              .then(function(){
                    deferred.resolve(authData.access_token);
                }).catch(function(e){
                    deferred.reject(e);
                });
         })
         .catch(function(e){
             deferred.reject(e);
         });
     }
     else {
       deferred.reject(error);
     }
   });

  return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData, callbackUrl){

  var deferred = Q.defer();

 //test token and get data
  exports
  .ensureAccessToken(oauthData, callbackUrl)
  .then(function(access_token){
    async.parallel([
          function(cb){
            request.get(generateDataRequestUrl(getAPIBaseUrl("/sleeps"), access_token), function (error, response, body) {
              asyncReqParser(body, cb);
            });
          },
          function(cb){
            request.get(generateDataRequestUrl(getAPIBaseUrl("/workouts"), access_token), function (error, response, body) {
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
              results = adapter.parseAll(oauthData.days, results[0].data, results[1].data);
            }
            else {
              results = adapter.parse(oauthData.days, results[0].data, results[1].data);
            }

            results = masterAdapter.buildAdapter(results, "Jawbone", "From Jawbone's last 30 days records.");

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

  //test token and get data
  exports.ensureAccessToken(oauthData, callbackUrl)
  .then(function(access_token){

     request.get(generateDataRequestUrl(getAPIBaseUrl("/sleeps"), access_token), function (error, response, body) {
        if (!error && response.statusCode === 200) {
          body = JSON.parse(body);

          if(body.Error && _.includes([4001, 4002], body.ErrorCode)){
            deferred.resolve(false);
            return;
          }
          deferred.resolve(true);
        }
        else {
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
