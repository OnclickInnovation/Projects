angular.module('synsorcare.directives.healthindicator', [])
.directive('healthIndicator', [function () {
    return {
        restrict: 'E',
        templateUrl: "javascripts/app/directives/health-indicator-selection/healthindicator.html",
        controller: 'HealthIndicatorDirectiveController',
        scope: {
            measurementId: '=selectMeasurementId',
            measurements: '=measurements',
            upperbound: '=upperbound',
            lowerbound: '=lowerbound',
            repeatInterval: '=repeatInterval',
            sensitivity: '=sensitivity',
            serviceName: '=serviceName',
            oauthAvailable: '=oauthAvailable',
            isOutofBound: '=isOutofBound',
            isMissed: '=isMissed'
        }
    };
}])
.controller('HealthIndicatorDirectiveController', ['$scope', function($scope){
    $scope.getCurrent = function(Id)
    {
        return _.find($scope.measurements, function(chr) {
            return chr.id == Id;
        });
    };

    $scope.repeatIntervalInHours = $scope.repeatInterval / 3600;

    $scope.$watch('repeatIntervalInHours', function(){
        $scope.repeatInterval = $scope.repeatIntervalInHours * 3600;
    }, true);

    if(!$scope.measurementId)
    {
        $scope.measurementId = 1;
        $scope.upperbound = 125;
        $scope.lowerbound = 100;
        $scope.repeatIntervalInHours = (86400 / (60 * 60));
        $scope.sensitivity = 2;
    }

    $scope.monitoringIntervals = [
            {
                id: 8,
                name: "Thrice a day"
            },
            {
                id: .5 * 24,
                name: "Twice a day"
            },
            {
                id: 1 * 24,
                name: "Daily"
            },
            {
                id: 3 * 24,
                name: "Every 3rd day"
            },
            {
                id: 7 * 24,
                name: "Weekly"
            }
        ];

    $scope.$watch('measurementId',function(){
        if($scope.getCurrent($scope.measurementId).name == 'Steps' || $scope.getCurrent($scope.measurementId).name == 'Sleep'){
                $scope.monitoringIntervals = [
                    {
                        id: 1 * 24,
                        name: "Daily"
                    }
                ];
                $scope.repeatIntervalInHours = 24;
            }
            else {
                $scope.monitoringIntervals = [
                    {
                        id: 8,
                        name: "Thrice a day"
                    },
                    {
                        id: .5 * 24,
                        name: "Twice a day"
                    },
                    {
                        id: 1 * 24,
                        name: "Daily"
                    },
                    {
                        id: 3 * 24,
                        name: "Every 3rd day"
                    },
                    {
                        id: 7 * 24,
                        name: "Weekly"
                    }
                ];
            }
    });

}]);
