'use strict';

var router = require('express').Router();
var cors = require('cors');
var url = require('url');
var oauthTokenModel = require('models').OauthMonitorToken;
var MeasurementMonitorModel = require('models').MeasurementMonitor;
var servicelist = require('../../../components/servicemap/servicelist');
var auth = require('./auth');
var jwt = require('../drivers/base/jwt');

var OauthTokenMapModel = require('models').OauthTokenMap;

router.get('/auth/:serviceId', function(req, res){

  var serviceId = req.params.serviceId;
  var urlParsed = url.parse(req.url, true);

  //if service is not hosted then return 404
  if(!servicelist.isServiceAvailable(serviceId)){
    return res.status(404).send("Service " + serviceId + " not present.");
  }

  var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId);

  //we have to register the service
  auth
    .beginOauth(serviceId, callbackUrl)
    .then(function(results){

      //model pk
      var oauth_map_key = OauthTokenMapModel.getPrimaryKey(results.oauth_token, serviceId);

      //save token
      OauthTokenMapModel
      .create({
          id: oauth_map_key,
          data: JSON.stringify({
            oauth_token_secret: results.oauth_token_secret,
            monitorId: urlParsed.query.monitorId,
            measurementId: urlParsed.query.measurementId
          })
        })
      .then(function(){
            //delete all last day records
            OauthTokenMapModel.destroy({where: ["DATE(updated_at) < CURRENT_DATE()"]});

            return res.redirect(results.redirectURL);
        })
      .catch(function(){
            return res.status(500).json("Unable to create oauth session.");
      });

    })
    .catch(function(err){
      console.log(err);
      return res.status(401).json(err);
    });

});


//call back handler for all apis , it will return oauth token in json object
// CORS is required here
router.get('/handle/:serviceId', cors(), function(req, res){

    var urlParsed = url.parse(req.url, true);
    var params = urlParsed.query;
    var serviceId = req.params.serviceId;

    var monitorId = null;
    var measurementId = null;

    //model pk
    var oauth_map_key = OauthTokenMapModel.getPrimaryKey(params.oauth_token, serviceId);
    OauthTokenMapModel
      .findById(oauth_map_key)
      .then(function(OauthMap){

        var oauthData = JSON.parse(OauthMap.data);

        //get the token secret from database
        var token_secret = oauthData.oauth_token_secret;

        //get other request data
        monitorId = oauthData.monitorId;
        measurementId = oauthData.measurementId;

        // now get the access token
        return auth.getAccessToken(serviceId, params.oauth_token, params.oauth_verifier, token_secret);
      })
      .then(function(results){

          var response = {};
          response.success = true;
          response.data = jwt.encode(results);
          var data = {
              monitor_id: monitorId,
              data: response.data,
              service_name: serviceId,
              oauth_data: JSON.stringify(results)
          };
          return oauthTokenModel
              .create(data)
              .then(function(oauthRow){
                  if(oauthRow)
                  {
                      MeasurementMonitorModel
                      .find({ id: measurementId})
                      .then(function(measure){
                          if(measure){
                              measure.oauth_id = oauthRow.id;
                              return measure
                              .save()
                              .then(function(data){
                                  //send window close event
                                  res.writeHeader(200, {"Content-Type": "text/html"});
                                  //send back message success
                                  res.write('<script>window.close();</script>');
                                  return res.end();
                              })
                              .catch(function(err){
                                  console.log(err);
                                  return res.send(err);
                              });
                          }
                      });
                  }
              })
              .catch(function(err){
                  console.error(err);
              });
      })
      .catch(function(err){
          return res.status(500).json(err);
      });

});

module.exports = router;
