'use strict';
angular.module('synsorcare.features.forgot',[
  'synsorcare.services.user'
])
.controller('ForgotPasswordController',[
  '$scope',
  '$location',
  'synsorcare.services.UserService',
  function($scope,$location,UserService){

    $scope.email = null;

    //messages for user
    $scope.alerts = [
      { type: 'warning', msg: 'Only Admin can reset password from here' },
    ];

    //submit action
    $scope.submit = function(){

      //still invalid
      if(!$scope.form.$valid){
        return;
      }

      $scope.$emit('wait:start');

      //send reset link to email
      UserService
      .resetPasswordLink($scope.email)
      .then(function(res){
        $scope.$emit('wait:stop');
        $location.path('/forgot/reset');
      })
      .catch(function(err){
        $scope.$emit('wait:stop');
        $scope.$emit("notification", {
            type: 'danger',
            message: err.data || "Server error"
        });
      });

    };

  }
])
.controller('ResetPasswordController',[
  '$scope',
  '$location',
  'synsorcare.services.UserService',
  function($scope,$location,UserService){

    $scope.data = {
      email : null,
      code : null,
      newPassword : null,
      confirmPassword : null
    };

    //messages for user
    $scope.alerts = [
      { type: 'warning', msg: 'Please use code you received in email' },
    ];

    $scope.$watch('data', function () {
        if($scope.data.newPassword && $scope.data.confirmPassword && $scope.data.newPassword != $scope.data.confirmPassword) {
            if($scope.form.newPassword.$dirty) {
                $scope.$broadcast('setInvalid:newPassword', 'New Password and Confirm Password must match');
            }
            if($scope.form.confirmPassword.$dirty) {
                $scope.$broadcast('setInvalid:confirmPassword', '');
            }
        } else if($scope.form) {
            if($scope.form.newPassword.$dirty) {
                $scope.$broadcast('setValid:newPassword', 'New Password and Confirm Password must match');
            }
            if($scope.form.confirmPassword.$dirty) {
                $scope.$broadcast('setValid:confirmPassword', '');
            }
        }
    }, true);


    //submit action
    $scope.submit = function(){

      if($scope.data.newPassword != $scope.data.confirmPassword) {
          $scope.$broadcast('setInvalid:newPassword', 'New Password and Confirm Password must match');
          $scope.$broadcast('setInvalid:confirmPassword', '');
          return;
      }

      if(!$scope.data.code) {
          $scope.$broadcast('setInvalid:code', 'This field is required');
          return;
      } else {
          $scope.$broadcast('setValid:code', 'This field is required');
      }

      //still invalid
      if(!$scope.form.$valid){
        return;
      }

      $scope.$emit('wait:start');

      //send reset link to email
      UserService
      .resetPasswordViaCode($scope.data)
      .then(function(res){
        $scope.$emit('wait:stop');
        $location.path('/forgot/success');
      })
      .catch(function(err){
        $scope.$emit('wait:stop');
        $scope.$emit("notification", {
            type: 'danger',
            message: err.data || "Server error"
        });
      });

    };

  }
])
.controller('ForgotSuccessController',[
  '$scope',
  '$location',
  function($scope,$location){

    //messages for user
    $scope.alerts = [
      { type: 'success', msg: 'Password Reset was successful' },
    ];

    //submit action
    $scope.submit = function(){
        $location.path('/login');
    };

  }
])
