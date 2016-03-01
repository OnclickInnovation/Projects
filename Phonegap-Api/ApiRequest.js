var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
	var access_token;
	request.get({
	    uri: config.apiBaseUrl.URL + '/WebService4/json/CustomerService.svc/access_token?client_id=' + config.Client.id + '&client_secret=' + config.Client.secret + '&grant_type=client_credentials',
	    method: 'GET'
  	}, function (err, res123, body) {
  		if(!err && body)
  		{
  			access_token =  body ? JSON.parse(body).access_token : false;
  			res.send(access_token);
  		}
  		else
  		{
  			res.status(403).send();	
  		}
	});
 });

module.exports = router;
