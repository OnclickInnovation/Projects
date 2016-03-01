"use strict";
angular.module('synsorcare.features.user.monitor', [
    'synsorcare.services.user',
    'synsorcare.services.measurement',
    'synsorcare.services.monitor',
    'ui.bootstrap.datetimepicker'
])
.controller('MonitorEditController', [
        '$scope',
        '$q',
        'synsorcare.services.MeasurementService',
        'synsorcare.services.MonitorService',
        'synsorcare.services.UserService',
        'synsorcare.services.MonitorListService',
        'synsorcare.services.MonitorMeasurementService',
        function ($scope, $q, MeasurementService, MonitorService, UserService, MonitorListService, MonitorMeasurementService) {
            $scope.$emit('pageLoaded', {
              title: "Monitor"
            });
            $scope.monitor = {};
            $scope.measurements = []; //list of all measurements like glucose, steps etc.
            $scope.monitorMeasurements = []; //list of all monitor's measurements

            var rememberedUser = MonitorListService.getLastViewedUser(); //current user on worklist
            var currentUser = UserService.fetchCachedUser(); //current logged in user

            $scope.$emit('wait:start');
            MeasurementService
            .getMeasurements()
            .then(function(data){
                $scope.$emit('wait:stop');
                $scope.measurements = data;
            });

            $scope.$emit('wait:start');
            MonitorListService
            .fetchMonitorList(currentUser.id)
            .then(function(data){
                $scope.$emit('wait:stop');
                //we have more then one monitor
                if(!_.isEmpty(data))
                {
                    $scope.monitor = data[0];
                    $scope.isNew = false;
                    $scope.$emit('wait:start');
                    MonitorMeasurementService
                    .getMonitorMeasurements($scope.monitor.id)
                    .then(function(data){
                        $scope.$emit('wait:stop');
                        $scope.monitorMeasurements = data;
                    });
                }
                else {
                    $scope.isNew = true;
                }
                if(!$scope.isNew){
                    $scope.data = {
                        description: $scope.monitor.description,
                        notify: $scope.monitor.notify,
                        sensitivity: $scope.monitor.sensitivity
                    };
                }
            });
            var selectedUser = currentUser;
            $scope.stageNext = !$scope.isNew; // stages in form

            //if the new monitor , select the first user,
            //otherwise if available use the current user on worklist
            $scope.useUser = {
                id: (!$scope.isNew && rememberedUser) ? rememberedUser : selectedUser.id
            };

            $scope.data = {
                description: null,
                notify: true,
                sensitivity: 2 //default sensitivity
            };


            $scope.$on('setForm', function (evt, form) {
                $scope.form = form;
            });

            $scope.ok = function () {
                $scope.$broadcast('validate');
                if(!$scope.form.$valid) {
                    return;
                }

                var record = null;

                if($scope.isNew){ //is new monitor then create it
                    record = {
                        description: $scope.data.description,
                        notify: $scope.data.notify,
                        //convert the incoming seconds to hours
                        sensitivity: $scope.data.sensitivity
                    };
                } else { //otherwise update the monitor
                    $scope.monitor.description = $scope.data.description;
                    $scope.monitor.notify = $scope.data.notify;
                    $scope.monitor.sensitivity = $scope.data.sensitivity;
                    record = $scope.monitor;
                }

                record.userId = currentUser.id;
                //empty measurements
                if($scope.monitorMeasurements.length < 1)
                {
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: "Please add atleast one indicator to monitor"
                    });
                    return;
                }

                //set sensitivity for all measurements same
                _.map($scope.monitorMeasurements, function(measurement){
                    measurement.sensitivity = $scope.data.sensitivity;
                });

                $scope.$emit('wait:start');

                var tempMonitor = null;

                (function(){
                    return $scope.isNew ? MonitorService.createMonitor(record) : MonitorService.updateMonitor(record);
                }())
                .then(function(monitorCreatedOrUpdated){
                    tempMonitor = monitorCreatedOrUpdated;
                    return MonitorMeasurementService.updateMonitorMeasurements(monitorCreatedOrUpdated.id, $scope.monitorMeasurements);
                }).then(function(){
                    if(!$scope.stageNext){
                        refreshDataSet(tempMonitor.id)
                        .then(function(){
                            $scope.$emit('wait:stop');
                            $scope.stageNext = true;
                        });
                    } else {
                        $scope.$emit('wait:stop');
                        $scope.$emit("notification", {
                            type: 'success',
                            message: "Monitor Updated"
                        });
                    }
                })
                .catch(function(){
                    $scope.$emit('wait:stop');
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: "Server error."
                    });
                });

            };

            //update the monitor and its measurements from API
            var refreshDataSet = function(monitorId){
                var deferred = $q.defer();

                //get the monitor
                MonitorService
                    .getMonitor(monitorId)
                    .then(function(monitorFetched){
                        $scope.monitor = monitorFetched;
                        $scope.isNew = false;
                        return MonitorMeasurementService.getMonitorMeasurements(monitorId);
                    })
                    .then(function(monitorMeasurementsFetched){
                        $scope.monitorMeasurements = monitorMeasurementsFetched;
                        deferred.resolve();
                    })
                    .catch(deferred.reject);

                return deferred.promise;
            };

            $scope.cancel = function () {
                if(isNew && !!monitor){
                    $modalInstance.close(monitor);
                } else {
                    $modalInstance.dismiss();
                }
            };

            $scope.getStateText = function(){
                return $scope.isNew ? 'Next' : ( $scope.stageNext ? 'Save' : 'Next' );
            };

            //add new health indicator
            $scope.addIndicator = function(){
                if($scope.monitorMeasurements.length >= 5)
                {
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: "Only 5 health indicator's are allowed"
                    });
                }
                else {
                    $scope.monitorMeasurements.push({});
                    $scope.stageNext = false;
                }
            };

            //delete monitor measurements
            $scope.$on('delete:monitor:measurement', function(event, data){
                if($scope.monitorMeasurements.length === 1)
                {
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: "Cannot delete all the health indicator's for a monitor"
                    });
                }
                else {
                    MonitorMeasurementService
                    .deleteMonitorMeasurements($scope.monitor.id, data.id)
                    .then(function(){
                        $scope.$emit("notification", {
                            type: 'success',
                            message: "Health indicator deleted successfully"
                        });
                        $scope.monitorMeasurements.splice(data.index, 1);
                    })
                    .catch(function(err){
                        console.log(err);
                        $scope.$emit("notification", {
                            type: 'danger',
                            message: "Server error."
                        });
                    });
                }
            });

            $scope.$on('monitor:edit:popup:refresh', function(){
                $scope.stageNext = false;
                $scope.ok();
            });

        }]);
