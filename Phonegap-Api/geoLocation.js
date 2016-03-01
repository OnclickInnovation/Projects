var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
/* GET home page. */
router.post('/', function(req, res, next) {
  var formData = {
      "BrandID": 433,
      "access_token": req.body.access_token
  };
  request.post({
      uri: config.apiBaseUrl.URL + '/WebService4/json/CustomerService.svc/locations/geoaware',
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
