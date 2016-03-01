"use strict";
var _ = require('lodash');
var async = require("async");
var moment = require("moment");
var request = require('request');
var Q = require('q');

var adapter = require('./adapter');
var masterAdapter = require('../base/master-adapter');

//Fitbit Url
var getFitbitUrl = function(url){
    url = url || '';
    return 'https://www.fitbit.com/' + url;
};

//get base url for api
var getAPIBaseUrl = function(url){
    url = url || '';
    return 'https://api.fitbit.com/' + url;
};

//second which are added when checking for a token expiry.
var TokenExpiryOffset = 60;

var config = {};

var tokenConfig = require('./config')(process.env.NODE_ENV);

/** Configurables **/
config.client_id = tokenConfig.client_id;
config.client_secret = tokenConfig.client_secret;
config.scope = "activity sleep weight profile";
config.apiUrl = getAPIBaseUrl();
config.authorization_url = "oauth2/authorize";
config.access_token_url = "oauth2/token";
config.refresh_token_url = "oauth2/token";

/** Configurables Ends **/

var redirectURL = getFitbitUrl(config.authorization_url);
var getAPITokenUrl = getAPIBaseUrl(config.access_token_url);


//internal callback to parse the response from userauth calls
var userConversion = function(err, data, promise){
    if(err){
        promise.reject(err);
        return;
    } else {
        data = JSON.parse(data);
        //if there is error in api
        if(data.errors){
            promise.reject(data);
            return;
        }

        var current_sec = parseInt((new Date()).getTime() / 1000);

        var resp = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires: current_sec + data.expires_in,
            token_type: data.token_type,
            user_id: data.user_id
        };

        promise.resolve(resp);
    }
};


// parse response from Fitbit to see if there is any error or not
var asyncReqParser = function(body, cb){

    var error = {};

    try{
        error = JSON.parse(body);
    } catch(e) {
        cb(null, body);
        return;
    }

    //if there is error
    if(error.errors){
        console.log("Rejected API Fitbit ", error);
        //but dont return error so we can read other params
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

var getRequestHeaders = function(){
    //Converting client_id:client_secret to base64 string
    var base64Code = new Buffer(config.client_id + ':' + config.client_secret).toString('base64');

    return {
        'Authorization': 'Basic ' + base64Code,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
};

/** prepare a url where user should be redirected and begin the oauth **/
exports.run = function(callbackUrl, sessionTokenId){

    //this is all the data to be sent
    var data = {
        client_id: config.client_id,
        response_type: 'code',
        scope: config.scope,
        state: sessionTokenId, //send session token so we can relogin the user

        // dont pass prepared redirect uri beaucse we need to attach `state` in handle stage
        //redirect_uri: callbackUrl //build redirect uri with state
    };
    callbackUrl = buildUrl(redirectURL, data);

    return callbackUrl;
};

//get Access token from Fitbit
exports.getAccessToken = function(code, callbackUrl){

    var deferred = Q.defer();

    var data = {
        client_id: config.client_id,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        code: code
    };

    request.post({
            url: getAPITokenUrl,
            headers: getRequestHeaders(),
            form: data
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                userConversion(null, body, deferred);
            } else {
                userConversion(error, body, deferred);
            }
    });

    return deferred.promise;
};


//get Access token from Fitbit using refresh token
exports.getAccessTokenViaRefreshToken = function(refresh_token){
    var deferred = Q.defer();

    var data = {
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
    };

    request.post({
            url: getAPITokenUrl,
            headers: getRequestHeaders(),
            form: data
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                userConversion(null, body, deferred);
            } else {
                userConversion(error, body, deferred);
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
exports.ensureAccessToken = function(oauthData){

    var deferred = Q.defer();

    //if access token is expired
    if(exports.tokenExpired(oauthData.expires)){
        console.log("Getting new access token for Fitbit");
        //request for new access tokens
        exports
        .getAccessTokenViaRefreshToken(oauthData.refresh_token)
        .then(function(resp){
            //we have some new data need to update to model
            return oauthData
                    .oauthModelInstance
                    .updateAttributes({
                        oauth_data: JSON.stringify(resp)
                    }).then(function(){
                        deferred.resolve(resp.access_token);
                    });
        })
        .catch(function(e){
            deferred.reject(e);
        });
    } else {
        console.log("Using old access token for Fitbit");
        deferred.resolve(oauthData.access_token);
    }

    return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData, callbackUrl){

    var deferred = Q.defer();
    var userid = oauthData.user_id;

    var today = moment().format("YYYY-MM-DD").toString();
    var ago31Day = moment().subtract(31, "days").format("YYYY-MM-DD").toString();

    var profileUrl = getAPIBaseUrl() + "1/user/" + userid + "/profile.json";
    var stepsUrl = getAPIBaseUrl() + '1/user/' + userid + '/activities/steps/date/' + today + '/30d.json';
    var sleepUrl = getAPIBaseUrl() + '1/user/' + userid + '/sleep/timeInBed/date/' + today + '/' + ago31Day + '.json';
    var weightLogUrl = getAPIBaseUrl() + '1/user/' + userid + '/body/log/weight/date/' + ago31Day + "/" + today + '.json';

    //test token and get data
    exports
    .ensureAccessToken(oauthData, callbackUrl)
    .then(function(access_token){
    async.parallel([
        function(cb){
            request.get({ url: profileUrl, headers: {Authorization: 'Bearer ' + access_token} }, function (error, response, body) {
                asyncReqParser(body, cb);
            });
        },
        function(cb){
            request.get({ url: stepsUrl, headers: {Authorization: 'Bearer ' + access_token} }, function (error, response, body) {
                asyncReqParser(body, cb);
            });
        },
        function(cb){
            request.get({ url: sleepUrl, headers: {Authorization: 'Bearer ' + access_token} }, function (error, response, body) {
                asyncReqParser(body, cb);
            });
        },
        function(cb){
            request.get({ url: weightLogUrl, headers: {Authorization: 'Bearer ' + access_token} }, function (error, response, body) {
                asyncReqParser(body, cb);
            });
        }],
        function(err, results){
            //send errors back
            if(err){
                deferred.reject(err);
                return;
            }

            if(oauthData.all)
            {
                console.dir(results);
                results = adapter.parseAll(results, oauthData.days);
            }
            else {
                results = adapter.parse(results);
            }

            results = masterAdapter.buildAdapter(results, "Fitbit", "From Fitbit's last 30 day records.");
            deferred.resolve(results);
        });
    })
    .catch(function(e){
        deferred.reject(e);
    });

    return deferred.promise;

};

/** check if oauthdata is expired or not **/
exports.expireCheck = function(oauthData, callbackUrl){
    var deferred = Q.defer();

    var userid = oauthData.user_id;
    var today = moment().format("YYYY-MM-DD").toString();

    var stepsUrl = getAPIBaseUrl() + '1/user/' + userid + '/activities/steps/date/' + today + '/30d.json';

    //test token and get data
    exports.ensureAccessToken(oauthData, callbackUrl)
    .then(function(access_token){

        request({url: stepsUrl, headers: {Authorization: 'Bearer ' + access_token}}, function (error, response, body) {

            if (!error && response.statusCode === 200){
                body = JSON.parse(body);
                if(body.errors){
                    deferred.resolve(false);
                    return;
                } else {
                    deferred.resolve(true);
                }
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
