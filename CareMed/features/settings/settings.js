"use strict";
angular.module('synsorcare.features.settings', [
  'synsorcare.services.user',
])
.controller('SettingsController', [
  '$scope',
  'synsorcare.services.UserService',
  function ($scope, UserService) {
    $scope.user = UserService.fetchCachedUser();
    $scope.$emit('pageLoaded', {
      title: "Settings"
    });
  }])
  .controller('SettingsAccountController', [
    '$scope',
    'synsorcare.services.UserService',
    function ($scope, UserService) {

      $scope.save = function (form) {

        if($scope.user.password && $scope.user.password != $scope.user.confirmPassword) {
          $scope.$broadcast('setInvalid:password', 'Password and Confirm Password must match');
          $scope.$broadcast('setInvalid:confirmPassword', '');
          return;
        }

        $scope.$broadcast('setValid:password');
        $scope.$broadcast('setValid:confirmPassword');
        //$scope.$broadcast('setValid:phone_mobile');
        //$scope.$broadcast('setValid:network_id');

        $scope.$emit('wait:start');
        UserService.updateUser($scope.user).then(function (userData) {
          $scope.user = userData;
          console.log('Updated User');
          console.log(userData);
          UserService.setCachedUser(userData);
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
            type: 'success',
            message: "Account updated"
          });
      }).catch(function (err) {
          $scope.$emit('wait:stop');
          if(err.status == 409)
          {
              $scope.$emit("notification", {
                type: 'danger',
                message: "Email already registered."
              });
          }
          else
          {
              $scope.$emit("notification", {
                type: 'danger',
                message: "Server error."
              });
          }
        });
      };
    }
  ])
  .controller('SettingsUsersController', [
    '$scope',
    '$modal',
    'synsorcare.services.UserService',
    function ($scope, $modal, UserService) {
      UserService.fetchAllUsers().then(function (users) {
        $scope.users = users;
      });

      $scope.addUser = function () {
        $scope.editUser({});
      };

      $scope.deleteUser = function (user) {
        if(!confirm("Are you sure you want to delete this user? There is no way to undo this deletion.")) {
          return;
        }
        $scope.$emit('wait:start');
        UserService.deleteUser(user.id).then(function () {
          $scope.$emit('wait:stop');
          return UserService.fetchAllUsers().then(function (users) {
            $scope.users = users;
          });
        }).catch(function () {
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server error."
          });
        });
      }
      $scope.editUser = function (user) {
        var instance = $modal.open({
          templateUrl: 'javascripts/app/features/settings/editUser.html',
          controller: 'SettingsUserEditController',
          resolve: {
            currentUser: function () {
              return $scope.user;
            },
            user: function () {
              return $.extend({}, user);
            }
          }
        });
        instance.result.then(function (userData) {
          console.log(user, userData);
          if(user.id) {
            $.extend(user, userData);
          } else {
            console.log(userData)
            $scope.users.push(userData);
          }
        })
      }
    }
  ])
  .controller('SettingsUserEditController', [
    '$scope',
    '$modalInstance',
    'user',
    'currentUser',
    'synsorcare.services.UserService',
    function ($scope, $modalInstance, user, currentUser, UserService) {
      $scope.user = user;
      $scope.currentUser = currentUser;
      console.log(user, currentUser);
      $scope.roles = [
        {name: 'Admin', value: 'Admin'},
        {name: 'User', value: 'User'}
      ];
      $scope.$on('setForm', function (evt, form) {
        $scope.form = form;
    });
      $scope.notification = "";
      $scope.ok = function () {
        $scope.$broadcast('validate');
        if(!$scope.form.$valid) {
          return;
        }
        $scope.waiting = true;
        if($scope.user.id) {
          if(!$scope.user.password) {
            delete $scope.user.password;
          }
          UserService.updateUser($scope.user).then(function (userData) {
            $scope.waiting = false;
            $scope.$emit("notification", {
              type: 'success',
              message: "User Updated"
            });
            $modalInstance.close(userData);
          }).catch(function (err) {
            switch(err.status) {
              case 409:
              $scope.notification = "Email already exists. Please try a different email";
              break;
              default:
              $scope.notification = "Server error";
              break;
            }
            $scope.waiting = false;
          });
        } else {
          UserService.createUser($scope.user).then(function (userData) {
            $scope.waiting = false;
            $scope.$emit("notification", {
              type: 'success',
              message: "User Created"
            });
            $modalInstance.close(userData);
          }).catch(function (err) {
            switch(err.status) {
              case 409:
              $scope.notification = "Email already exists. Please try a different email";
              break;
              default:
              $scope.notification = "Server error";
              break;
            }
            $scope.waiting = false;
          });
        }
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }
  ]);
