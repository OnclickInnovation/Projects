var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
/* GET home page. */
router.post('/', function(req, res, next) {
	console.log(req.body);
	var formData = {
       "CustomerPhone": req.body.CustomerPhone,
       "CustomerLastName": req.body.CustomerLastName,
       "CustomerFirstName": req.body.CustomerFirstName,
       "CustomerEmail": req.body.CustomerEmail,
       "CustomerGuid": req.body.CustomerGuid,
       "CustomerID": req.body.CustomerID,
       "LocationID": req.body.LocationID,
       "access_token": req.body.access_token,
       "GiftCertificateID": req.body.GiftCertificateID,
       "PaymentItem": req.body.PaymentItem,
        "SendEmailReceipt": req.body.SendEmailReceipt
        };
        console.log(formData);
	request.post({
	    uri: config.apiBaseUrl.URL + '/WebService4/json/CustomerService.svc/gift_certificate/purchase',
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
