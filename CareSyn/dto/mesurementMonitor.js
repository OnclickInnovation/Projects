'use strict';

var _ = require('lodash');
var Q = require('q');

module.exports = {
    marshal: function (measurementModel) {

        var deffered = Q.defer();
          var obj = measurementModel.toJSON();
          measurementModel
          .getAuthData()
          .then(function(data){
                  deffered.resolve({
                    id: obj.id,
                    measurementId: obj.measurement_id,
                    monitorId: obj.monitor_id,
                    upperbound: obj.upperbound,
                    lowerbound: obj.lowerbound,
                    sensitivity: obj.sensitivity,
                    next_reading: obj.next_reading,
                    repeatInterval: obj.repeat_within_seconds,
                    oauthAvailable: !!measurementModel.oauth_id,
                    serviceName: data ? _.capitalize(data.service_name) : null,
                    isOutOfBound: measurementModel.isOutofBounds(),
                    isMissed: measurementModel.isMissed(),
                    updated_at: obj.updated_at
                });
          })
          .catch(function(err){
              deffered.reject(err);
          });

         return deffered.promise;
    },
    unmarshal: function (rawData) {

        return {
            id : rawData.id,
            measurement_id: rawData.measurementId,
            monitor_id: rawData.monitorId,
            upperbound: rawData.upperbound,
            lowerbound: rawData.lowerbound,
            repeat_within_seconds: rawData.repeatInterval,
            sensitivity: rawData.sensitivity
        };
    }
};
