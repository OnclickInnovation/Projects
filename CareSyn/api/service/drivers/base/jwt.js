/** Synsormed library for handing encode and decode of the JWT tokens **/

var jwt = require('jwt-simple');
var _   = require('lodash');

// hash from aminholmes/healthkit-permission merge
//don't change , all oauth token wil become invalid
var __secret = 'd44ac8bc953cec3294aee12c358556222ed5d4fc';
var algo  = 'HS512';

/** encode bunch of data **/
module.exports.encode = function(raw){
  return jwt.encode(raw, __secret, algo)
};

/** decode data **/
module.exports.decode = function(encoded){

  if(_.isEmpty(encoded)){
    return encoded;
  }

  if(_.isObject(encoded)){
    return encoded;
  }

  //jwt.decode fail when non encrypted string is parsed.
  try {
    return jwt.decode(encoded, __secret);
  } catch(e){
    return encoded;
  }

};
