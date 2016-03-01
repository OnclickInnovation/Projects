angular.module('synsorcare.portal', [
    'templates',
    'ngRoute',
    'ngAnimate',
    'ui.bootstrap',
    'uiSwitch',
    'highcharts-ng',
    'LocalStorageModule',
    'AuraDropdownModule',
    'synsorcare.directives.datepicker',
    'synsorcare.directives.toggleList',
    'synsorcare.directives.safereading',
    'synsorcare.directives.indicatorList',
    'synsorcare.directives.healthindicator',
    'ui-rangeSlider',
    'synsorcare.features.login',
    'synsorcare.features.user',
    'synsorcare.features.dashboard',
    'synsorcare.features.settings',
    'synsorcare.features.register',
    'synsorcare.features.forgot',
    'synsorcare.components.wait',
    'synsorcare.services.user',
    'synsorcare.services.monitor'
])
    .constant('env', {
        'apiBaseUrl': '/proxy/v1/'
    })
    .constant('publicUrls',[
        '/',
        '/register',
        '/login',
        '/forgot',
        '/forgot/reset',
        '/forgot/success'
    ])
    .config(['$routeProvider', '$httpProvider', function ($route, $httpProvider) {
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.defaults.headers.common['x-csrf'] = '"' + sessionStorage.getItem('x-csrf') + '"';
        $httpProvider.defaults.headers.common['X-Session-Token'] = sessionStorage.getItem('X-Session-Token');
        $httpProvider.interceptors.push(['$rootScope', '$q', function($rootScope, $q) {
          return {
            'responseError': function(errorResponse) {
                if(errorResponse.status == 403)
                {
                    $rootScope.$broadcast('session:loggedOut');
                }
                return $q.reject(errorResponse);
            }
          };
        }]);
        $route.when('/', {
            controller: ['$scope',function ($scope) {
                $scope.foo = "";
            }],
            template: "<div class='container'><h1>Welcome</h1><p>Please select one of the links on the top to use the application.</p></div>"
        });

        $route.when('/showMonitor', {
            resolve: {
                monitor: ['synsorcare.services.MonitorService', '$route', function (MonitorService, $route) {
                    return MonitorService.getMonitor($route.current.params.id);
                }]
            },
            controller: 'ShowMonitorController',
            templateUrl: 'javascripts/app/features/user/showMonitor/showMonitor.html'
        });


        $route.when('/login', {
            controller: 'LoginController',
            templateUrl: 'javascripts/app/features/login/login.html',
            resolve: {
                removeCurrentUser: ['synsorcare.services.UserService', function (UserService) {
                    UserService.clearCachedUser();
                }]
            }
        });

        $route.when('/register', {
            controller: 'RegisterController',
            templateUrl: 'javascripts/app/features/register/register.html'
        });

        $route.when('/monitor', {
            controller: "MonitorEditController",
            templateUrl: 'javascripts/app/features/user/monitor/monitor.html',
            resolve: {
                users: ['synsorcare.services.UserService', function (UserService) {
                    return UserService.fetchAllUsers();
                }]
            }
        });

        $route.when('/dashboard', {
            controller: "DashboardController",
            templateUrl: 'javascripts/app/features/dashboard/dashboard.html'
        });

        $route.when('/settings', {
            controller: "SettingsController",
            templateUrl: 'javascripts/app/features/settings/settings.html'
        });

        $route.when('/forgot', {
            controller: "ForgotPasswordController",
            templateUrl: 'javascripts/app/features/forgot/forgotLink.html'
        });

        $route.when('/forgot/reset', {
            controller: "ResetPasswordController",
            templateUrl: 'javascripts/app/features/forgot/resetForm.html'
        });

        $route.when('/forgot/success', {
            controller: "ForgotSuccessController",
            templateUrl: 'javascripts/app/features/forgot/forgotSuccess.html'
        });
    }])
    .controller('AppContainerController', ['$scope', '$rootScope', '$location', 'synsorcare.services.UserService', '$timeout', '$interval', 'isOnPublicUrl', function ($scope, $rootScope, $location, UserService, $timeout, $interval, isOnPublicUrl){
        $scope.$on('$routeChangeSuccess', function () {
            $scope.currentuser = UserService.fetchCachedUser();
        });

        //check if we the url is active or not
        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };
        $scope.$on('session:loggedOut', function() {
            $location.path('/login');
        });
        //check if session not expired
        $interval(function(){
            if(!UserService.fetchCachedUser())
            {
                if(isOnPublicUrl($location.path()))
                {
                    $location.path('/login');
                }
            }
        }, 15000);

        $scope.today = new Date();
        $rootScope.notification = null;

        var notificationTimeout = null;
        $rootScope.showNotification = false;

        $rootScope.showMenu = true;
        $scope.$on('noMenu', function(event, data) {
             $rootScope.showMenu = false;
         });
        $scope.$on('showMenu', function(event, data) {
              $rootScope.showMenu = true;
        });
        $rootScope.$on('notification', function (evt, notification){
            $timeout.cancel(notificationTimeout);
            $rootScope.notification = notification;
            $rootScope.showNotification = true;
            notificationTimeout = $timeout(function () {
                $rootScope.showNotification = false;
                $timeout(function () {
                    if(!$rootScope.showNotification) {
                        $rootScope.notification = null;
                    }
                }, 2000)
            }, 5000);
        });

    }])
    .run([
        '$location',
        '$interval',
        '$rootScope',
        'synsorcare.components.wait.WaitService',
        'synsorcare.services.UserService',
        '$route',
        'isOnPublicUrl',
        function ($location, $interval, $rootScope, WaitService, UserService, $route, isOnPublicUrl) {
        $rootScope.currentuser = window.currentuser;
        $rootScope.page = {
            title: "Synsorcare"
        };

        $rootScope.$on('wait:start', function () {
            WaitService.start();
        });
        $rootScope.$on('wait:stop', function () {
            WaitService.stop();
        });
        $rootScope.$on('wait:forceStop', function () {
            WaitService.forceStop();
        });
        $rootScope.$on('$routeChangeStart',function () {
            WaitService.start();
            $rootScope.page.title = "Synsorcare";
        });
        $rootScope.$on('$routeChangeSuccess',function () {
            WaitService.forceStop();
        });
        $rootScope.$on('$routeChangeError',function () {
            WaitService.forceStop();
            $location.path('/login');
        });

        $rootScope.$on('pageLoaded', function (evt, data) {
            $rootScope.page.title = "Synsorcare: " + data.title;
        })

        //check if session expired
        if(!UserService.fetchCachedUser()) {
            if(isOnPublicUrl($location.path()))
            {
                $location.path('/login');
            }
        }

        var lastMouseMove = new Date();
        $( "body" ).mousemove(function( event ) {
            lastMouseMove = new Date();
        });

        $interval(function () {
            var now = new Date();
            if(now.getTime() - lastMouseMove.getTime() > 15*60*1000) {
                if(isOnPublicUrl($location.path()))
                {
                    $location.path('/login');
                }
                UserService.clearCachedUser();
            }
        }, 30000);
    }])
    .directive('form', [function () {
        return {
            restrict: 'E',
            link: {
                post: function ($scope, $element) {
                    $scope.$emit('setForm', $scope.form);
                }
            }
        };
    }])
    .directive('help', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: "<span class='help'><i class='fa fa-question-circle' popover-placement='right' popover='{{helpText}}' popover-trigger='mouseenter'></span>",
            scope: {
                helpText: '@'
            }
        }
    }])
    .directive('validate', ['$timeout',function ($timeout) {
        return {
            restrict: 'A',
            link: {
                post: function ($scope, $element, attrs) {
                    var status = {
                        dirty: false,
                        invalid: false
                    };

                    var errContainer = $('<small>').addClass('error-container').addClass('ng-hide');
                    var input = $element.find('input');
                    if(!input.length) {
                        input = $element.find('select');
                    }

                    var inputName = input.attr('name');

                    $element.append(errContainer);
                    function getErrorText() {
                    //This is sort of a stub, but it'll work until more complicated validation
                    //cases are introduced.
                        var errors = $scope.form[inputName].$error;
                        for(var errorType in errors) {
                            if(!errors[errorType]) {
                            //There was a validation error, but it's been taken care of
                                continue;
                            }
                            switch(errorType) {
                                case "required": return "This field is required"; break;
                                case "characters": return "This field contains invalid characters"; break;
                                case "email": return "Invalid email format"; break;
                                case "max": return "Value must be less than " + input.attr('max'); break;
                                case "min": return "Value must be greater than " + input.attr('min'); break;
                                case "maxlength": return "Value must be less than " + input.attr('ng-maxlength') + " characters long "; break;
                                case "minlength": return "Value must be greater than " + input.attr('ng-minlength') + " characters long"; break;
                            }
                            return errorType;
                        }
                    }
                    function updateWrapper() {
                        if(status.dirty) {
                            $element.addClass('dirty');
                        } else {
                            $element.removeClass('dirty');
                        }

                        if(status.invalid && status.dirty) {
                            $element.addClass('has-error');
                            errContainer.text(getErrorText());
                            errContainer.removeClass('ng-hide');
                        } else {
                            errContainer.text('');
                            errContainer.addClass('ng-hide');
                            $element.removeClass('has-error');
                        }
                    }
                    input.on('keyup', function () {
                        updateWrapper();
                    });
                    input.on('blur', function () {
                        updateWrapper();
                    });
                    $scope.$on('$destroy', function () {
                        errContainer.remove();
                    });
                    if($scope.form && inputName) {
                        $scope.$on('validate', function () {
                            if(!input.is('select')) {

                              //prevent two digest loop at same time, timeout by 1 sec
                              $timeout(function() {
                                input.triggerHandler('change');
                              }, 1);

                            } else {
                                status.dirty = true;
                            }
                            updateWrapper();
                        });
                        $scope.$watch('form.' + inputName + '.$dirty', function (newVal) {
                            status.dirty = newVal;
                            updateWrapper();
                        }, true);
                        $scope.$watch('form.' + inputName + '.$invalid', function (newVal) {
                            status.invalid = newVal;
                            updateWrapper();
                        }, true);
                        $scope.$on('setInvalid:' + inputName, function (evt, type) {
                            status.dirty = true;
                            status.invalid = true;
                            $scope.form[inputName].$setValidity(type, false);
                            updateWrapper();
                        });
                        $scope.$on('setValid:' + inputName, function (evt, type){
                            status.dirty = true;
                            status.invalid = false;
                            $scope.form[inputName].$setValidity(type, true);
                            updateWrapper();
                        });
                    }
                }
            }
        };
    }])
    .filter('secondsToDateTime',[function(){
        return function(seconds){
          return new Date(1970, 0, 1).setSeconds(seconds);
        }
    }])
    .filter('secondsToHoursString',[function(){
      return function(sec){
          var d = 60;

          var templ = ["hrs","min","sec"];

          var times = templ.map(function(v,k){

              //reverse key using circular shift in Math.Pow
              a = parseInt(Math.pow(d,2-(k*k)));
              t = a > 0 ? parseInt(sec / a, 10) : sec;

              //decrease seconds after each calculation
              sec = sec - (t * a);
              return t > 0 ? t +" "+ templ[k] : null;
          });

          times = times.join(" ").trim();

          return times.length == 0 ? "0 sec" : times ;
        };
    }]).directive('tagsInput', [function(){
      return {
        restrict: 'EA',
        transclude: true,
        scope: {
            tags: '=ngModel'
        },
        link: function(scope, element) {
            var tags = scope.tags ? scope.tags.split(',') : [];

            $(element).tagsinput({ mintags: 3, maxTags: 3, confirmKeys: [13, 44]});
            $(element).siblings('div').children('input').css("width", "150px");
            //add tags to the input
            tags.forEach(function(v){
                $(element).tagsinput('add', v);
            });

            //add a single tag, check if its a valid mail type
            $(element).on('beforeItemAdd', function(event) {
                var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                if(re.test(event.item)){
                    event.cancel = false; //add this tag
                    tags.push(event.item);
                    scope.tags = tags.toString();
                    scope.$apply();
                }
                else {
                    event.cancel = true; // dont add this tag
                }
            });

            //remove a single tag
            $(element).on('beforeItemRemove', function(event) {
                _.pull(tags, event.item);
                scope.tags = tags.toString();
                scope.$apply();
            });

            scope.$on('$destroy', function() {
                $(element).tagsinput('destroy');
            });
        }
      };
    }])
    .directive('threshold',[function(){
      return {
        restrict : 'A',
        scope : {
          safeLevel : "=",
          currentLevel : "="
        },
        link : {
          post : function($scope, $element, attrs){
              if($scope.safeLevel > $scope.currentLevel){
                $element.removeClass('alert-success');
                $element.addClass('alert-warning');
              } else {
                $element.removeClass('alert-warning');
                $element.addClass('alert-success');
              }
          }
        }
      };
    }])
    /** debounce , an JS techinque that can prevent additional functional calls within defined time **/
    .factory('debounce', ['$timeout',function($timeout) {
        return function(callback, interval) {
            var timeout = null;
            return function() {
                $timeout.cancel(timeout);
                timeout = $timeout(callback, interval);
            };
        };
    }])
    .factory('isOnPublicUrl', ['publicUrls', function(publicUrls) {
        return function(path) {
            return publicUrls.indexOf(path) == -1 ? true : false;
        };
    }]);
