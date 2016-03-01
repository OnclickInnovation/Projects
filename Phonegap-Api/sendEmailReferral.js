var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');

/* GET home page. */
router.post('/', function(req, res, next) {
  var data =  {
    "client_id": config.referralApi.clientId,
    "secret": config.referralApi.clientSecert,
    "type": "email", 
    "to": "sethshines@gmail.com" || req.body.to,
    "guest_name": "Seth",
    "host_id": 5
  }
	
  request({
	    uri: config.mailBaseUrl.URL,
	    method: 'POST',
      formData: data
  	}, function (err, res123, body) {
  		if(JSON.parse(body).status === "success")
  		{
  			res.send(true);
  		}
  		else
  		{
  			res.status(403).send();	
  		}
	});
 });

module.exports = router;
