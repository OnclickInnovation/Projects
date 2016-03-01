angular.module('synsorcare.features.login', [
    'synsorcare.services.user'
])
    .controller('LoginController', [
      '$scope',
      'synsorcare.services.UserService',
      '$route',
      '$location',
      'localStorageService',
      function ($scope, UserService, $route, $location, localStorageService) {

        $scope.$emit('pageLoaded', {
          title: "Login"
        });

        var saveEmailKey = 'savedEmail';
        $scope.rememberMe = !!localStorageService.get(saveEmailKey);

        //if we have email in localstorage get it
        if($scope.rememberMe){
          $scope.email = localStorageService.get(saveEmailKey);
        }

        if($location.search().showRegistrationMessage) {
            $scope.showRegistrationMessage = true;
        }

        $scope.submit = function () {
            $scope.$broadcast('validate');
            if(!$scope.form.$valid) {
                return;
            }
            $scope.$emit('wait:start');

            /**
             * This should never be done, but due to a bug with autofilled forms, it has to be..
             */
            $("input").trigger('change');
            /**
             * End hack
             */

            UserService.login($scope.email, $scope.password)
                .then(function (user) {
                    UserService.setCachedUser(user);

                    //remember the user
                    if($scope.rememberMe){
                      localStorageService.set(saveEmailKey, $scope.email);
                    } else { //or forget
                      localStorageService.remove(saveEmailKey);
                    }

                    switch(user.role.toLowerCase()) {
                        case "superadmin":
                            $location.path('/admin/insights');
                            break;
                        case "admin":
                            $location.path('/dashboard');
                            break;
                        case "provider":
                            $location.path('/monitor');
                            break;
                        case "user":
                            $location.path('/generateCode');
                            break;
                    }
                }).catch(function (resp) {
                    $location.search({
                        'showRegistrationMessage': null
                    });
                    $scope.$emit('wait:stop');
                    if(resp.status == 403)
                    {
                      $scope.alert = {
                          msg: 'Your organization has been deactivated.',
                          type: 'danger'
                      };
                    }
                    else {
                      $scope.alert = {
                          msg: 'Please check your username and password and try again.',
                          type: 'danger'
                      };
                    }
                });
            $scope.$emit('pageLoaded', {
                title: "Login"
            });
        };
    }]);
