angular.module('synsorcare.services.measurement', [])
    .service('synsorcare.services.MeasurementService', ['$http', '$q', 'env', function ($http, $q, env) {

        var measurements = null;

        return {
            getMeasurements : function(){
              var deferred = $q.defer();
              $http.get(env.apiBaseUrl + 'rest/measurement',{cache:false}).then(function (resp) {
                  measurements = resp.data;
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
            },
            getCachedMeasurements : function(){
              var deferred = $q.defer();

              if(measurements !== null){
                deferred.resolve(measurements);
              } else {
                this
                .getMeasurements()
                .then(function(data){
                  deferred.resolve(data);
                })
                .catch(function(e){
                  deferred.reject(e);
                });
              }

              return deferred.promise;
            }
        };
    }]);
