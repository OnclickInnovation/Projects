angular.module('synsorcare.features.user.showMonitor', ['synsorcare.services.email'])
.controller('ShowMonitorController', [
  '$scope',
  '$location',
  'monitor',
  '$modal',
  function ($scope, $location, monitor, $modal) {
    $scope.monitor = monitor;

    $scope.printInfo = function () {
      window.print();

    };
    $scope.SendEmail = function () {

      //Send to email modal
      var modalInstance = $modal.open({
        templateUrl: 'javascripts/app/features/provider/showMonitor/emailMonitor.html',
        controller: 'EmailMonitorController',
        resolve: {
          monitor: function () {
            return monitor;
          },
          users: function () {
            return $scope.users;
          }
        }
      });

      //on modal close
      modalInstance.result.then(function (data) {
        if(data)
        {
          //if email sent
          $scope.$emit("notification", {
            type: 'success',
            message: "Success"
          });
        }
        else {
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server Error."
          });
        }
      });

    };
    $scope.$emit('pageLoaded', {
      title: "Print Monitor Code"
    });
  }])
  .controller('EmailMonitorController', [
    '$scope',
    '$modalInstance',
    'monitor',
    'synsorcare.services.EmailService',
    function($scope, $modalInstance, monitor, EmailService){
      $scope.monitor = monitor;
      $scope.email = {
        data: null
      };
      $scope.$on('setForm', function (evt, form) {
          $scope.form = form;
      });
      $scope.ok = function () {

        //for validation's
        $scope.$broadcast('validate');
        if(!$scope.form.$valid) {
            return;
        }

        $scope.$emit('wait:start');

        //emial service  for sending emails
        EmailService.sendCodeEmail($scope.email.data, $scope.monitor.id, 'monitor')
        .then(function(){
          $scope.$emit('wait:stop');
          $modalInstance.close(true);
        })
        .catch(function(err){
          console.error(err);
          $scope.$emit('wait:stop');
          $modalInstance.close(false);
        });
      };
      $scope.cancel = function () {
        $modalInstance.dismiss();
      };
    }]);
