'use strict';
var router = require('express').Router();
var cors = require('cors');
var url = require('url');
var oauthTokenModel = require('models').OauthMonitorToken;
var MeasurementMonitorModel = require('models').MeasurementMonitor;
var servicelist = require('../../../components/servicemap/servicelist');
var auth = require('./auth');
var jwt = require('../drivers/base/jwt');

router.get('/auth/:serviceId', function(req, res){

    var serviceId = req.params.serviceId;
    var urlParsed = url.parse(req.url, true);

    //if service is not hosted then return 404
    if(!servicelist.isServiceAvailable(serviceId)){
        return res.status(404).send("Service " + serviceId + " not present.");
    }

    var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId);

    //we have to register the service
    auth.beginOauth(serviceId, callbackUrl, res.redirect.bind(res), req.sessionID);

    //if request has monitorId then assign it to session
    if(urlParsed.query.monitorId){
        req.session.monitorId = urlParsed.query.monitorId;
        req.session.measurementId = urlParsed.query.measurementId;

        req.session.save(function(e){
            if(e) { console.log(e); }
        });
    }

});


//call back handler for all apis , it will return code from the Oauth services
// CORS is required here
router.get('/handle/:serviceId', cors(), function(req, res){
    var urlParsed = url.parse(req.url, true);
    var code = urlParsed.query.code;
    var serviceId = req.params.serviceId;
    if(urlParsed.query.state)
    {
        var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId) + '?state=' + urlParsed.query.state;
    }
    else
    {
        var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId);
    }


    // now get the access token
    auth
    .getAccessToken(serviceId, code, callbackUrl)
    .then(function(results){
        var response = {};

        response.success = true;
        response.data = jwt.encode(results);
        if(urlParsed.query.state){
            req.sessionStore.load(urlParsed.query.state, function(err, sessionData){
                //no session data
                if(err || !sessionData){
                    //send success response with code
                    return res.status(200).json(response);
                }
                var data = {
                    monitor_id: sessionData.monitorId,
                    oauth_data: JSON.stringify(results),
                    service_name: serviceId
                };
            return  oauthTokenModel
                .create(data)
                .then(function(oauthRow){
                    if(oauthRow)
                    {
                        MeasurementMonitorModel
                        .find({ id:sessionData.measurementId})
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
            });

        } else {
            //send success response with code
            return res.status(200).json(response);
        }
    })
    .catch(function(err){
        console.log(err);
        return res.status(401).send(err.message);
    });

});

module.exports = router;
