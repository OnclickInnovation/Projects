'use strict';
var router = require('express').Router({mergeParams: true});
var logger = require('logger');
var Q = require('q');
var OauthMonitorTokenModel = require('models').OauthMonitorToken;

/**
 * Delete a single oauth token of monitor
 *
 * @param :oauthId , Interger , OauthMonitorToken Table id to delete
 *
 */
router.delete('/:oauthId', function (req, res) {
        var queries = [];
        req
        .monitorModel
        .getMeasurementMaps()
        .then(function(measurements){
            if(!measurements.length){
                return res.json(true);
            }
            measurements.forEach(function(measurement){

                //unlink measurement id if connected withg oauthId
                if(measurement.oauth_id == req.params.oauthId){
                        queries.push(measurement.updateAttributes({
                        oauth_data: null,
                        service_name: null,
                        oauth_id: null
                    }));
                }
            });
            return Q.all(queries)
            .then(function(){

                //delete oauth tokens
                return OauthMonitorTokenModel.destroy({where: {id: req.params.oauthId}});
            })
            .then(function(){
                return res.json(true);
            });
        })

        .catch(function(e){
            logger.error(e);
            res.status(500).json(e.message);
        });
});

module.exports = router;
