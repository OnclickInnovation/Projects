"use strict";
var _ = require('lodash');
var Q = require('q');

var mapMeasurementsName = function(measurements){
    var nameArray = [];
    if(measurements){
        measurements.forEach(function(val){
            nameArray.push(_.capitalize(val.Measurement.name));
        });
    }
    nameArray = _.uniq(nameArray);
    return nameArray;
};

module.exports = {
  marshal: function (monitorModel) {
        return Q.all([
          monitorModel.getUser(),
          monitorModel.getMeasurementMaps()
        ])
        .then(function(data){
                var measurements = data[1];
                var user = data[0];
                return {
                  id: monitorModel.id,
                  patientCode: monitorModel.patient_code,
                  description: monitorModel.description,
                  createdAt: monitorModel.created_at,
                  providerId: monitorModel.provider_id,
                  termsAccepted: monitorModel.terms_accepted,
                  notify: monitorModel.notify,

                  providerName: user.name,
                  isOutofBound: monitorModel.isOutofBounds(measurements),
                  isMissed: monitorModel.isMissed(measurements),
                  appointmentMeta: monitorModel.appointment_meta ? JSON.parse(monitorModel.appointment_meta) : null,

                  measurementName: mapMeasurementsName(measurements),
                  sensitivity: _.get(measurements, '[0].sensitivity', 2),

                  //need for mobile app auth
                  isMonitor: true,

                  /** backward app compatibility **/
                  code: monitorModel.patient_code
           };
      })
      .catch(function(e){
        console.log(e);
      });
  },
  unmarshal: function (rawData) {
    var monitorData = {
      id: rawData.id,
      description: rawData.description,
      provider_id: rawData.providerId,
      user_id: rawData.userId,
      terms_accepted: rawData.termsAccepted,
      notify: rawData.notify
    };
    return monitorData;
  }
};
