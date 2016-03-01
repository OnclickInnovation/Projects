var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
/* GET home page. */
router.post('/', function(req, res, next) {
	console.log(req.body.AppointmentPayment);
	var formData = {
        "Amount": req.body.Amount,
    	  "LocationID": req.body.LocationID,
        "access_token": req.body.access_token,
        "GiftTo": req.body.GiftTo,
        "GiftFrom": req.body.GiftFrom,
        "GiftMessage": req.body.GiftMessage,
        "GiftTemplateId": req.body.GiftTemplateId
	};
	

	request.post({
	    uri: config.apiBaseUrl.URL + '/WebService4/json/CustomerService.svc/gift_certificate/create',
	    json: true,
	    headers: {
	        "content-type": "application/json",
	    },
	    body: formData
  	}, function (err, res123, body) {
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
