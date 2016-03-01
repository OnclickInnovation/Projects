'use strict';

var MonitorModel = require('models').Monitor;
var UserModel = require('models').User;
var Q = require('q');

//check current user is allowed to set the oauth data or not
module.exports = function(monitorId, currentUser, sessionMonitorCode){

    var deferred = Q.defer();

    MonitorModel.find({
      where: {id: monitorId},
      include: [UserModel]
      })
      .then(function(monitor){
              //keep them as == , dont change to ===, string and number doesn't match on ===
              if(monitor && (monitor.User.org_id == currentUser.org_id || monitor.patient_code == sessionMonitorCode)){
                  deferred.resolve();
              } else {
                  deferred.reject(new Error("User not authorized"));
              }
      })
      .catch(function(e){
          deferred.reject(e);
      });

    return deferred.promise;
};
