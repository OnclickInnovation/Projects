var oauth = require('oauth');

var version = "2.0";

/** Method to build a Oauth Object **/
exports.buildOAuthObject = function(config){
  return new oauth.OAuth2(
                  config.client_id,
                  config.client_secret,
                  config.apiUrl,
                  config.authorization_url,
                  config.access_token_url,
                  null
                );
}

//get Access token from a service
exports.getAccessToken = function(config, code, params, callback){

  var data = this.buildOAuthObject(config);

  //make external API call
  data.getOAuthAccessToken(code,params,function(err,access_token, refresh_token, response){

    if(err){
      callback(true,JSON.parse(err.data));
      return;
    }
    else {

      var result = {}

      result.access_token = access_token;
      result.refresh_token = refresh_token;
      result.raw = response;

      callback(false,result);
      return;
    }

  });

}

module.exports = exports;
