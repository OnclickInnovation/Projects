"use strict";
angular.module('synsorcare.features.dashboard', ['synsorcare.services.user', 'synsorcare.services.monitor'])
.controller('DashboardController',
        [
            '$scope',
            '$q',
            '$interval',
            'synsorcare.services.UserService',
            'synsorcare.services.MonitorService',
            'synsorcare.services.MonitorListService',
            'synsorcare.services.MonitorMeasurementService',
             function ($scope, $q, $interval, UserService, MonitorService, MonitorListService, MonitorMeasurementService) {

                $scope.$emit('pageLoaded', {
                  title: "Dashboard"
                });

                $scope.user = UserService.fetchCachedUser();
                $scope.alert = {
                  msg: ' to view dashboard',
                  type: 'success'
                };
                $scope.showLink = true;

                $scope.monitors = [];
                $scope.services = [];
                $scope.measurements = [];
                $scope.monitorMeasurements = [];
                $scope.showReports = true;
                ///Monitor charts
                $scope.selected = {
                    id : null
                };

                //fetch all monitors of user
                $scope.$emit('wait:start');
                MonitorListService.fetchMonitorList($scope.user.id)
                 .then(function(data){
                    if(_.isEmpty(data)) {
                      throw new Error("No Monitor Found");
                    }
                    $scope.alert.msg = null;
                    $scope.alert.type = null;
                    if(data.length >= 1) { data = data[0]; }
                    $scope.monitor = data;
                    return MonitorMeasurementService.getMonitorMeasurements($scope.monitor.id)
                 }).then(function(measurements){
                   $scope.$emit('wait:stop');
                   $scope.notification = "";

                   if(_.isEmpty(measurements)){
                     return null;
                   }

                   $scope.monitorMeasurement = measurements;
                   ///Monitor charts
                   $scope.selected = {
                       id : $scope.monitorMeasurement[0].id
                   };
                   $scope.monitorMeasurements = _.map($scope.monitorMeasurement, function(measurement){
                       if(measurement.serviceName){
                           measurement.name = measurement.name + ' ( ' + measurement.serviceName + ' ) ';
                       }
                       return measurement;
                   });
                   $scope.monitorMeasurements = _.uniq($scope.monitorMeasurement, function(measurement){
                       return measurement.measurementId + measurement.serviceName;
                   });

                 }).catch(function(e){
                   $scope.$emit('wait:stop');
                   if (e.message == "No Monitor Found") {
                     $scope.alert.msg = ' to view dashboard';
                     $scope.alert.type = 'success';
                     $scope.showLink = true;
                   } else {
                     $scope.alert.msg = 'Server Error';
                     $scope.alert.type = 'danger';
                     $scope.showLink = false;
                   }
                 });


                 $scope.chartSeries = [
                     {
                         showInLegend: false,
                         data: [],
                         color: '#F05F3A',
                         type: 'line'
                     },
                     {
                         showInLegend: false,
                         data: [],
                         color: '#007872',
                         type: 'line'
                     }
                 ];

                 $scope.xAxis = {
                     gridLineWidth: 0,
                     labels: { enabled: true, style: {fontWeight: 'bold' } },
                     title: { text: null },
                     categories: []
                 };

                 $scope.$watch('selected.id', function(){
                     $scope.chartSeries[0].data = [];
                     $scope.chartSeries[1].data = [];

                     //no monitors loaded yet
                     if(!$scope.monitor || !$scope.selected){
                       return;
                     }

                     $scope.$emit('wait:start');
                     MonitorService
                     .getMonitorInsights($scope.monitor.id, $scope.selected.id)
                     .then(function(data){
                         if(data.categories)
                         {
                             var localDates = [];
                             //steps date format regular expression
                             var re = /^\d{1,2}\s.{3}\s\d{4}$/;
                             if(re.test(data.categories[0]))
                             {
                                 data.categories.forEach(function(date){
                                     localDates.push(date);
                                 });
                             }
                             else {
                                 data.categories.forEach(function(date){
                                     localDates.push(moment(date, 'YYYY-MM-DDTHH:mm:ss.sssZ').format('D MMM YYYY h:mm A'));
                                 });
                             }

                             $scope.notification = false;
                             $scope.xAxis.categories = localDates;
                             $scope.chartSeries[0].data = data.series1;
                             if(!_.isEmpty(data.series2))
                             {
                                 $scope.chartSeries[1].data = data.series2;
                             }
                             $scope.$emit('wait:stop');
                         }
                     })
                     .catch(function(error){
                         $scope.chartSeries[0].data = [];
                         $scope.chartSeries[1].data = [];
                         if(error.status === 409)
                         {
                             $scope.notification = 'Service has no readings available for current measurement';
                         }
                         else if (error.status === 404) {
                             $scope.notification = 'No service linked';
                         }
                         else {
                             $scope.notification = 'No readings available';
                         }
                         $scope.$emit('wait:stop');
                     });

                     $scope.chartConfig = {
                         options: {
                             chart: {
                                 type: 'line',
                                 backgroundColor: 'rgba(255, 255, 255, 0.1)'
                             },
                             plotOptions: {
                                 column: {
                                     states: {
                                         hover:
                                         {
                                             color: {
                                                 linearGradient: {x1: 0, y1: 1, x2: 0, y2: 0},
                                                 stops: [
                                                     [0, '#F05F3A'],
                                                     [1, '#EF3809']
                                                 ]
                                             }
                                         }
                                     },
                                     color: {
                                         linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                                         stops: [
                                             [0, '#00918a'],
                                             [1, '#00ABA2']
                                         ]
                                     }
                                 }
                             },
                             tooltip: {
                                 borderWidth: 0,
                                 useHTML: true,
                                 backgroundColor: '#FFFFFF',
                                 formatter: function() {
                                     var unit = this.point.extra.unit != null ?
                                     "<tr><td><b>Unit</b></td><td>" + this.point.extra.unit + "</td></tr>" :
                                     "";
                                     return '<table class="text-left table-condensed">' +
                                     '<tr><td><b>Indicator</b></td><td>' + _.capitalize(this.point.extra.name) + '</td></tr>' +
                                     unit +
                                     '<tr><td><b>Reading</b></td><td>' + this.point.extra.reading + '</td></tr>' +
                                     '</table>';
                                 }
                             },
                             yAxis: {
                                 //commented for line charts
                                 //gridLineWidth: 0,
                                 //labels: {enabled: false },
                                 title: {text: null }
                             },
                             xAxis: $scope.xAxis,
                             series: $scope.chartSeries
                         },
                         series: $scope.chartSeries,
                         title: {text: null},
                         credits: {enabled: false},
                         loading: false,
                         xAxis: $scope.xAxis
                     };
                });

                 $scope.getIndicatorName = function(id){
                     switch (id) {
                         case 1:
                             return "Glucose";
                         break;
                         case 2:
                             return "Steps";
                         break;
                         case 3:
                             return "Hearbeat";
                         break;
                         case 4:
                             return "Weight";
                         break;
                         case 5:
                             return "Sleep";
                         break;
                         case 6:
                             return "Blood Pressure";
                         break;
                     }
                 };
              }]);
