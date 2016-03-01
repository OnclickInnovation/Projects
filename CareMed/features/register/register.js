angular.module('synsorcare.features.register', [
    'synsorcare.services.user',
    'synsorcare.services.monitor'
])
.controller('RegisterController', [
        '$scope',
        '$location',
        'synsorcare.services.UserService',
        'synsorcare.services.MonitorService',
        'synsorcare.services.MonitorMeasurementService',
        function ($scope, $location, UserService, MonitorService, MonitorMeasurementService) {
        $scope.showForm = true;
        $scope.user = {};
        $scope.practice = {};
        $scope.$on('setForm', function (evt, form) {
            $scope.form = form;
        });

        $scope.$emit('pageLoaded', {
          title: "Register"
        });

        $scope.$watch('user', function () {
            if($scope.user.password && $scope.user.confirmPassword && $scope.user.password != $scope.user.confirmPassword) {
                if($scope.form.password.$dirty) {
                    $scope.$broadcast('setInvalid:password', 'Password and Confirm Password must match');
                }
                if($scope.form.confirmPassword.$dirty) {
                    $scope.$broadcast('setInvalid:confirmPassword', '');
                }
            } else if($scope.form) {
                if($scope.form.password.$dirty) {
                    $scope.$broadcast('setValid:password', 'Password and Confirm Password must match');
                }
                if($scope.form.confirmPassword.$dirty) {
                    $scope.$broadcast('setValid:confirmPassword', '');
                }
            }
        }, true);

        $scope.submit = function () {
            if($scope.user.password != $scope.user.confirmPassword) {
                $scope.$broadcast('setInvalid:password', 'Password and Confirm Password must match');
                $scope.$broadcast('setInvalid:confirmPassword', '');
                return;
            }

            $scope.$broadcast('validate');
            if(!$scope.form.$valid) {
                return;
            }
            $scope.$emit('wait:start');
            $scope.user.role = 'Admin';
            UserService
            .createUser($scope.user)
            .then(function(data){
                MonitorService
                .createMonitor({
                    'description': '',
                    'userId': data.id,
                    "notify": true
                })
                .then(function(data){
                    $scope.$emit('wait:stop');
                    $scope.$emit('notification',{
                          type:  'success',
                          message: 'Registration Successful'
                    });
                    $location.path('/login');
                });
            })
            .catch(function(err){
                $scope.$emit('wait:stop');
                if(err.status == 422)
                {
                    $scope.$emit('notification',{
                          type:  'danger',
                          message: err.data
                        });
                }
            });
        };
    }
]);
