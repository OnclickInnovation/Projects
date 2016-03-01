var oauth = require('oauth');

var version = "1.0";

/** Method to build a Oauth Object **/
exports.buildOAuthObject = function(config){

  return new oauth.OAuth(
                  config.request_token_url,
                  config.access_token_url,
                  config.consumer_key,
                  config.consumer_secret,
                  version,
                  null,
                  config.signature
                );
}

//get Access token from a service
exports.getAccessToken = function(config, oauthToken, oauthVerifier, oauthTokenSecret, callback){

  var data = this.buildOAuthObject(config);

  //make external API call
  data.getOAuthAccessToken(oauthToken,oauthTokenSecret,oauthVerifier,function(err,token,token_secret,response){

    if(err){
      callback(true,JSON.parse(err.data));
      return;
    }
    else {

      var result = {}

      result.token = token;
      result.token_secret = token_secret;
      result.raw = response;

      callback(false,result);
      return;
    }

  });

}

/** get Request token from a service
 *  @param config , will be object containing all details about service
 *  @param callbackUrl , where user will be redirected back
 *  @param callback , function(err,results){}
 */
exports.getRequestToken = function(config,callbackUrl,callback){

  var data = this.buildOAuthObject(config);

  var extraParams = {};

  if(callbackUrl){
    extraParams.oauth_callback = callbackUrl;
  }

  //make external API call
  data.getOAuthRequestToken(extraParams,function(err, oauth_token, oauth_token_secret, results){

    if(err){
      callback(true,JSON.parse(err.data));
      return;
    }
    else {
      var result = {}

      result.oauth_token = oauth_token;
      result.oauth_token_secret = oauth_token_secret;

      callback(false,result);
      return;
    }

  });

}

module.exports = exports;
