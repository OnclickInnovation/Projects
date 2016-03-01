var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
/* GET home page. */
router.post('/', function(req, res, next) {
	var access_token;
	var TreatmentTimeSlots = new Array();
	var index = 0;
	req.body.TreatmentID.forEach(function(data){
		TreatmentTimeSlots.push({
			"CurrentPrice": {
				"Amount": 0,
				"CurrencyCode": ""
			},
			"Duration": null,
			"EmployeeID": null,
			"StartDateTime": "/Date(" + req.body.StartDateTime[index] + ")/",
			"TreatmentID": data,
			"RoomID": null,
			"Employee2ID": null,
			"PrefferedStaffGender": null,
			"EmployeeWasRequested": false
		});
		index++;
	});
	var formData = {
		"ItineraryTimeSlot": {
			"CurrentPackagePrice": {
			"Amount": 0,
			"CurrencyCode": ""
		},
		"IsPackage": false,
		"PackageID": null,
		"StartDateTime": "/Date(" + req.body.StartDateTime[0] + ")/",
		"TreatmentTimeSlots": TreatmentTimeSlots,
		"PrefferedStaffGender": null
		},
		"LocationID": req.body.LocationID,
		"access_token": req.body.access_token
	};
	console.log(JSON.stringify(formData))
	request.post({
	    uri: config.apiBaseUrl.URL + '/WebService4/json/CustomerService.svc/appointment/createincomplete',
	    json: true,
	    headers: {
	        "content-type": "application/json",
	    },
	    body: formData
  	}, function (err, res123, body) {
		if(!err && body){
			res.send(body);
		}
		else
		{
			res.status(500).send();
		}
  	})
 });

module.exports = router;
