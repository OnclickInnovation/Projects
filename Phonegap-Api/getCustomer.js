var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
/* GET home page. */
router.get('/:locationID/:access_token', function(req, res, next) {
	console.log(req.query);
	request.get({
	    uri: config.apiBaseUrl.URL + '/WebService4/json/CustomerService.svc/customer/87127093?access_token=9e66a88f-80bf-401b-b1fb-2bc5d7f01087',
	    method: 'GET'
  	}, function (err, res123, body) {
  		console.log(body, err);
  		if(!err && body)
  		{
  			console.log(body);
 			res.send(body);
  		}
  		else
  		{
  			res.status(500).send();
  		}
	});
 });

module.exports = router;
