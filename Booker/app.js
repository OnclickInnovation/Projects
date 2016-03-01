var phonecatApp = angular.module('booker', [
  'ngAnimate',
  'ngRoute',
  'ui.bootstrap',
  'login',
  'booking',
  'register',
  'services',
  'availability',
  'manageAppointments',
  'payment',
  'rewardPoints',
  'location',
  'gifts',
  'referFriend',
  'booker.service.book',
  'giftDetails',
  'ui.bootstrap',
  "ngCordova",
  "ngCordovaOauth",
  '720kb.socialshare',
  'facebook',
  "selectionModel"
])
.run([
      '$rootScope', function ($rootScope) {
          $rootScope.facebookAppId = '[551803548322995]'; // set your facebook app id here
      }
])
.controller('MainController', ['$scope', '$timeout', '$rootScope', '$location', '$interval', 'booker.service.book.BookerService', function($scope, $timeout, $rootScope, $location, $interval, BookerService){
  $scope.showNotification = false;
  
  var notificationTimeout;
  $rootScope.alreadyLoggedIn = false;
  $scope.fb = {
    URL: "https://www.facebook.com/MarilynMonroeSpas"
  };
  //start Loader
  $rootScope.$on('wait:start', function(){
    $rootScope.showSpinner = true;
  });
  //stop Loader
  $rootScope.$on('wait:stop', function(){
    $rootScope.showSpinner = false;
  });
  $scope.showLogin = true;
  $scope.showLogout = false;
  $scope.likeFb = function(){
    var ref = window.open('https://www.facebook.com/MarilynMonroeSpas', '_blank', 'EnableViewPortScale=yes,location=yes');
  }
  $scope.folowGooglePlus = function(){
    var ref = window.open('https://plus.google.com/u/0/+Marilynmonroespas/posts', '_blank', 'EnableViewPortScale=yes,location=yes');
  }
  $scope.twitter = function(){
    var ref = window.open('https://twitter.com/MarilynSpas', '_blank', 'EnableViewPortScale=yes,location=yes');
  }
  $scope.logout = function(){
      sessionStorage.User = null;
      sessionStorage.clear();
      $scope.showLogin = true;
      $scope.showLogout = false;
      localStorage.removeItem("UserCridentials");
      $location.path('/login');
  };
  $scope.$on('user:loggedIn', function(){

    $rootScope.showSpinner = false;
    $scope.showLogin = false;
    $scope.showLogout = true;
  });
  
  $scope.$on('notification', function (evt, notification){
            $timeout.cancel(notificationTimeout);
            $scope.notification = notification;
            $scope.showNotification = true;
            notificationTimeout = $timeout(function () {
                $scope.showNotification = false;
                $timeout(function () {
                    if(!$scope.showNotification) {
                        $scope.notification = null;
                    }
                }, 2000)
            }, 3000);
            $('.back-to-top-badge, .back-to-top').trigger( "click" );
        });
  if(localStorage)
  {
    var user = JSON.parse(localStorage.getItem('UserCridentials'));
    if(user)
    {
      $rootScope.alreadyLoggedIn = true;
      $rootScope.showSpinner = false;
      $scope.showLogin = false;
      $scope.showLogout = true;
    }
  }
  $interval(function(){ BookerService.authenticateAccessToken();  }, 120000);
}]);
//phonecatApp.value('apiRequestUrl', 'http://localhost:4000');
phonecatApp.value('apiRequestUrl', 'http://marilyn-monroe.herokuapp.com');

phonecatApp.config(function($routeProvider, selectionModelOptionsProvider) {
    selectionModelOptionsProvider.set({
    selectedAttribute: 'mySelectedObjectAttribute',
    selectedClass: 'my-selected-dom-node',
    type: 'checkbox',
    mode: 'multiple-additive',
    cleanupStrategy: 'deselect'
  });
    $routeProvider.
      when('/booking', {
        templateUrl: './features/Booking/Booking.html',
        controller: 'bookingController'
      }).
      when('/login', {
        templateUrl: './features/Login/Login.html',
        controller: 'loginController'
      }).
      when('/sendGifts', {
        templateUrl: './features/giftCertificates/giftCertificate.html',
        controller: 'giftCertificateController'
      }).
      when('/services/:locationId', {
        templateUrl: './features/Service/Service.html',
        controller: 'serviceController'
      }).
      when('/register', {
        templateUrl: './features/Register/Register.html',
        controller: 'registerController'
      }).
      when('/availability', {
        templateUrl: './features/Availability/Availability.html',
        controller: 'availabilityController'
      }).
      when('/referFriend', {
        templateUrl: './features/referFriend/referFriend.html',
        controller: 'referFriendController'
      }).
      when('/payment/:gift', {
        templateUrl: './features/Payment/Payment.html',
        controller: 'paymentController'
      }).
      when('/referDetails/:email', {
        templateUrl: './features/referFriend/referDetails.html',
        controller: 'referDetailsController'
      }).
      when('/manage', {
        templateUrl: './features/ManageAppointments/ManageAppointments.html',
        controller: 'manageAppointmentController'
      }).
      when('/rewardPoints', {
        templateUrl: './features/RewardPoints/RewardPoints.html',
        controller: 'rewardPointsController'
      }).
      when('/geoLocation', {
        templateUrl: './features/locations/locations.html',
        controller: 'locationController'
      }).
      when('/giftDetails', {
        templateUrl: './features/giftDetails/giftDetails.html',
        controller: 'giftDetailsController'
      }).
      otherwise({
        redirectTo: '/login'
      });

  });
// formats a number as a latitude (e.g. 40.46... => "40°27'44"N")
phonecatApp.filter('lat', function () {
    return function (input, decimals) {
        if (!decimals) decimals = 0;
        input = input * 1;
        var ns = input > 0 ? "N" : "S";
        input = Math.abs(input);
        var deg = Math.floor(input);
        var min = Math.floor((input - deg) * 60);
        var sec = ((input - deg - min / 60) * 3600).toFixed(decimals);
        return deg + "°" + min + "'" + sec + '"' + ns;
    }
});

// formats a number as a longitude (e.g. -80.02... => "80°1'24"W")
phonecatApp.filter('lon', function () {
    return function (input, decimals) {
        if (!decimals) decimals = 0;
        input = input * 1;
        var ew = input > 0 ? "E" : "W";
        input = Math.abs(input);
        var deg = Math.floor(input);
        var min = Math.floor((input - deg) * 60);
        var sec = ((input - deg - min / 60) * 3600).toFixed(decimals);
        return deg + "°" + min + "'" + sec + '"' + ew;
    }
});

phonecatApp.filter('serviceFilter', function () {
    return function (items, search) {
        var result = [];
        angular.forEach(items, function (value, key) {
          if(search === 'All')
          {
            result.push(value);
          }
          else
          {
            if (value.Category.Name === search) {
                  result.push(value);
            }
          }
        });
        return result;
    }
});

phonecatApp.directive("appMap", function () {
    return {
        restrict: "E",
        replace: true,
        template: "<div></div>",
        scope: {
            loaction: "=",
            center: "=",        // Center point on the map (e.g. <code>{ latitude: 10, longitude: 10 }</code>).
            markers: "=",       // Array of map markers (e.g. <code>[{ lat: 10, lon: 10, name: "hello" }]</code>).
            width: "@",         // Map width in pixels.
            height: "@",        // Map height in pixels.
            zoom: "@",          // Zoom level (one is totally zoomed out, 25 is very much zoomed in).
            mapTypeId: "@",     // Type of tile to show on the map (roadmap, satellite, hybrid, terrain).
            panControl: "@",    // Whether to show a pan control on the map.
            zoomControl: "@",   // Whether to show a zoom control on the map.
            scaleControl: "@"   // Whether to show scale control on the map.
        },
        link: function (scope, element, attrs) {
            var toResize, toCenter;
            var map;
            var currentMarkers;

            // listen to changes in scope variables and update the control
            var arr = ["width", "height", "markers", "mapTypeId", "panControl", "zoomControl", "scaleControl"];
            for (var i = 0, cnt = arr.length; i < arr.length; i++) {
                scope.$watch(arr[i], function () {
                    cnt--;
                    if (cnt <= 0) {
                        updateControl();
                    }
                });
            }

            // update zoom and center without re-creating the map
            scope.$watch("zoom", function () {
                if (map && scope.zoom)
                    map.setZoom(scope.zoom * 1);
            });
            scope.$watch("loaction", function () {

                map.setCenter(getLocation(scope.loaction));
                //updateMarkers();
            });
            scope.$watch("center", function () {
                if (map && scope.center)
                    map.setCenter(getLocation(scope.center));
            });

            // update the control
            function updateControl() {

                // update size
                if (scope.width) element.width(scope.width);
                if (scope.height) element.height(scope.height);
                // get map options
                var options =
                {
                    center: new google.maps.LatLng(40, -73),
                    zoom: 10,
                    mapTypeId: "roadmap"
                };
                if (scope.center) options.center = getLocation(scope.center);
                if (scope.zoom) options.zoom = scope.zoom * 1;
                if (scope.mapTypeId) options.mapTypeId = scope.mapTypeId;
                if (scope.panControl) options.panControl = scope.panControl;
                if (scope.zoomControl) options.zoomControl = scope.zoomControl;
                if (scope.scaleControl) options.scaleControl = scope.scaleControl;

                // create the map
                map = new google.maps.Map(element[0], options);

                // update markers
                updateMarkers();

                // listen to changes in the center property and update the scope
                google.maps.event.addListener(map, 'center_changed', function () {

                    // do not update while the user pans or zooms
                    if (toCenter) clearTimeout(toCenter);
                    toCenter = setTimeout(function () {
                        if (scope.center) {

                            // check if the center has really changed
                            if (map.center.lat() != scope.center.lat ||
                                map.center.lng() != scope.center.lon) {

                                // update the scope and apply the change
                                scope.center = { lat: map.center.lat(), lon: map.center.lng() };
                                if (!scope.$$phase) scope.$apply("center");
                            }
                        }
                    }, 500);
                });
            }

            // update map markers to match scope marker collection
            function updateMarkers() {
                if (map && scope.markers) {

                    // clear old markers
                    if (currentMarkers != null) {
                        for (var i = 0; i < currentMarkers.length; i++) {
                            currentMarkers[i] = m.setMap(null);
                        }
                    }

                    // create new markers
                    currentMarkers = [];
                    var markers = scope.markers;
                    if (angular.isString(markers)) markers = scope.$eval(scope.markers);
                    for (var i = 0; i < markers.length; i++) {
                        var m = markers[i];
                        var loc = new google.maps.LatLng(m.lat, m.lon);
                        var mm = new google.maps.Marker({ position: loc, map: map, title: m.name });
                        currentMarkers.push(mm);
                    }
                }
            }

            // convert current location to Google maps location
            function getLocation(loc) {
                if (loc == null) return new google.maps.LatLng(40, -73);
                if (angular.isString(loc)) loc = scope.$eval(loc);
                return new google.maps.LatLng(loc.lat, loc.lon);
            }
        }
    };
});