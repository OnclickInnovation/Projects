'use strict';

angular.module('synsorcare.directives.indicatorList', [
    'synsorcare.services.monitor'
])
.controller('IndicatorListDirectiveController', [
    '$scope',
    '$modal',
    'synsorcare.services.MonitorMeasurementService',
    function($scope, $modal, MonitorMeasurementService){
        // function for removing indicator from list
        $scope.removeIndicator = function(index, monitorMeasurement){
            if(monitorMeasurement.id){
                var isDelete = confirm("Do you want to delete this indicator ?");
                if(isDelete){
                    $scope.$emit('delete:monitor:measurement',  {'id': monitorMeasurement.id, 'index': index});
                }
                return;
            } else {
                _.pullAt($scope.monitorMeasurements, index);
            }
        };
        // function for get name of measurement from its id like glucose, steps etc.
        $scope.getCurrentMeasurementName = function(Id)
        {
            var measure =  _.find($scope.measurements, function(chr) {
                return chr.id == Id;
            });
            return measure ? measure.name : null;
        };

        // function for showing measurement's OauthLink
        $scope.monitorOauthLink = function(measurementId, monitorId, monitorMeasurementId){
            var modalInstance = $modal.open({
                templateUrl: 'javascripts/app/directives/indicator-list/service-list.html',
                controller: 'MonitorOauthDirectiveController',
                windowClass: 'monitor-service-modal',
                resolve: {
                    monitorId: function () {
                        return monitorId;
                    },
                    measurementId: function () {
                        return measurementId;
                    },
                    monitorMeasurementId: function(){
                        return monitorMeasurementId;
                    }
                }
            });

            //reload the monitor list
            modalInstance.result.then(function(oauthData){

                $scope.$emit("wait:start");
                if(!oauthData){
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: "synsorcare Connected Failed"
                    });
                    return;
                }
                // //update this data with monitor
                // MonitorMeasurementService
                // .setOauthDataForMeasurement(monitorId, monitorMeasurementId, oauthData, true)
                // .then(function(data){
                //     $scope.$emit("wait:stop");
                //     $scope.$emit("notification", {
                //         type: 'success',
                //         message: "synsorcare Connected"
                //     });
                //     $scope.$emit('monitor:edit:popup:refresh');
                // });
            });

            modalInstance.result.finally(function(){
                $scope.$emit('wait:stop');
            });
        };
    }])
    .controller('MonitorOauthDirectiveController', [
        '$scope',
        '$window',
        '$timeout',
        '$interval',
        '$modalInstance',
        'measurementId',
        'monitorId',
        'monitorMeasurementId',
        'synsorcare.services.MonitorServicesService',
        'synsorcare.services.MonitorService',
        'localStorageService',
        'synsorcare.services.MonitorMeasurementService',
        function($scope, $window, $timeout, $interval, $modalInstance, measurementId, monitorId, monitorMeasurementId, MonitorServicesService, MonitorService, localStorage, MonitorMeasurementService){
            $scope.services = null;

            $scope.$emit("wait:start");

            MonitorServicesService
            .getServicesForMonitor(monitorId, measurementId)
            .then(function(services){
                $scope.$emit("wait:stop");
                $scope.services = _.filter(services, function(s){
                    //remove oauthless services
                    return parseInt(s.version) !== 0;
                });

                return MonitorServicesService
                .getConnectedService(monitorId)
                .then(function(serviceName){
                    for(var i = 0; i < $scope.services.length; i++){
                        for(var j = 0; j < serviceName.length; j++){
                            if($scope.services[i].name == serviceName[j].service_name){
                                $scope.services[i].connected = serviceName[j];
                            }
                        }
                    }
                });
            })
            .catch(function(e){
                console.log(e);
                $scope.$emit("wait:stop");
                $scope.$emit('notification', {
                    type: 'danger',
                    message: 'Server Error'
                });
            });

            $scope.ok = function() {
                $modalInstance.dismiss('close');
            };

            var eventId = null;

            $scope.startOauth = function(service){
                $scope.isConnected = service.connected;
                var w = 450;
                var h = 450;
                var left = (screen.width / 2) - (w / 2);
                var top = (screen.height / 2) - (h / 2);

                // if (window.navigator.appVersion.indexOf("MSIE") != -1)
                // {
                //     if(!$scope.isConnected){
                //         //pass the monitor id to attach token to
                //         var ref = $window.open(service.apiUrl + '?monitorId=' + monitorId + port , service.title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
                //         eventId = service.name;
                //         sessionStorage.setItem('daaaaaa', "");
                //         $interval(checkWindowClosed(ref), 2000);
                //     } else {
                //         $modalInstance.close({
                //             service_name: service.name
                //         });
                //     }
                // }

                if(!$scope.isConnected){
                    //pass the monitor id to attach token to
                    var ref = $window.open(service.apiUrl + '?measurementId=' + measurementId + '&monitorId=' + monitorId , service.title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
                    eventId = service.name;
                    var interval = $interval(function(){
                        if(ref.closed)
                        {
                             $interval.cancel(interval);
                             MonitorMeasurementService
                             .setOauthDataForMeasurement(monitorId, monitorMeasurementId, {service_name: service.name}, true)
                             .then(function(data){
                                 $scope.$emit("wait:stop");
                                 $scope.$emit("notification", {
                                     type: 'success',
                                     message: "synsorcare Connected"
                                 });
                                 $modalInstance.close(true);
                                 $scope.$emit('monitor:edit:popup:refresh');
                             });
                        }
                    }, 900);
                } else {
                    $scope.$emit("wait:start");
                    //update this data with monitor
                    MonitorMeasurementService
                    .setOauthDataForMeasurement(monitorId, monitorMeasurementId, {service_name: service.name}, true)
                    .then(function(data){
                        $scope.$emit("wait:stop");
                        $scope.$emit("notification", {
                            type: 'success',
                            message: "synsorcare Connected"
                        });
                        $scope.$emit('monitor:edit:popup:refresh');
                    });

                    $modalInstance.close(true);
                }
            };
        //     // Create IE + others compatible event handler
        //     var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        //     var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
        //
        //         $(window).unbind(messageEvent);
        //
        //         // Listen to message from child window
        //         $(window).bind(messageEvent, function(e){
        //             if(!eventId) { return false; }
        //             e = e.originalEvent;
        //             if(e.data && e.data.success){
        //                 $modalInstance.close({
        //                     oauth_data: e.data.data,
        //                     service_name: eventId
        //                 });
        //             } else {
        //                 $modalInstance.close(false);
        //             }
        //         });
        //
        //         $scope.$on('$destroy', function(){
        //             $(window).unbind(messageEvent);
        //         });
        //     }
        }
    ])
    .directive('indicatorList', [function(){
        return {
            restrict: 'E',
            templateUrl: "javascripts/app/directives/indicator-list/indicator-list.html",
            controller: "IndicatorListDirectiveController",
            scope: {
                measurements: '=measurements',
                monitorMeasurements: '=monitorMeasurements',
                monitorId: '=monitorId'
            }
        };
    }]);
