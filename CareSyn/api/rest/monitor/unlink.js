'use strict';

var logger = require('logger');
var Q = require('q');

module.exports = function (req, res) {
        var queries = [];
        req
        .monitorModel
        .getMeasurementMaps(req.params.measurementId)
        .then(function(measurements){

            if(!measurements.length){
                return res.json(true);
            }
            measurements.forEach(function(measurement){
                queries.push(measurement.updateAttributes({
                    oauth_data: null,
                    service_name: null,
                    oauth_id: null
                }));
            });
            return Q.all(queries)
            .then(function(){
                return res.json(true);
            });
        })

        .catch(function(e){
            logger.error(e);
            res.status(500).json(e.message);
        });
};
