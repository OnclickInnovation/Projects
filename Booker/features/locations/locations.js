angular
.module('location', ['booker.service.book'])
.controller('locationController', ['$rootScope', '$scope', '$location', 'booker.service.book.BookerService', function($rootScope, $scope, $location,  BookerService){
	$scope.$emit('wait:start');
	BookerService
    .getAccessTokenFromSS()
    .then(function(access_token){
    	$scope.access_token = access_token;
    	
    	var input = {
    		access_token: access_token
    	};
    	$scope.$emit('wait:stop');
        $scope.$emit('wait:start');
    	BookerService
		.findLocationsGeoAware(input)
		.then(function(locations){
			$scope.$emit('wait:stop');
			console.log(locations);
		})
		.catch(function(err){
			$scope.$emit('wait:stop');
			$scope.$emit("notification", {
		        type: 'danger',
		        message: err.data || "Server error"
		    });
			console.log(err);
		});
    });
    $scope.$emit('wait:start');
    // current location
    var currrentLocation = sessionStorage.location ? JSON.parse(sessionStorage.location) : {Latitude: 0, Longitude: 0};
    console.log("HERE IS THE CURRENT LOCATION");
    console.log(currrentLocation.Latitude);
    console.log(currrentLocation.Longitude);
    $scope.airports = [
         { "name": "Your Current Location", "code": "Loc", "city": "", "state": "", "lat": currrentLocation.Latitude, "lon": currrentLocation.Longitude, "vol2016": 4414121 },
         { "name": "Florida: Orlando Mills Park", "code": "NAIL LOUNGE", "city": "Orlando", "state": "FL", "lat": 28.564, "lon": -81.365, "vol2011": 44414121 },
         { "name": "Florida: Windermere Grove at Isleworth", "code": "GLAMOUR ROOM", "city": "Orlando", "state": "FL", "lat": 28.492, "lon": -81.511, "vol2011": 31892301 },
         { "name": "Florida: Winter Park Lakeside", "code": "GLAMOUR ROOM", "city": "Orlando", "state": "FL", "lat": 28.597, "lon": -81.366, "vol2011": 30528737 },
         { "name": "Florida: Hyatt Regency Grand Cypress Orlando", "code": "HOTEL AND RESORT SPA", "city": "Orlando", "state": "FL", "lat": 28.382, "lon": -81.510, "vol2011": 27518358 },
         { "name": "Florida: Jacksonville Riverside", "code": "NAIL LOUNGE", "city": "Orlando", "state": "FL", "lat": 30.323, "lon": -81.670, "vol2011": 25667499 },
         { "name": "Florida: St. Petersburg Sundial", "code": "GLAMOUR ROOM", "city": "Orlando", "state": "FL", "lat": 27.774, "lon": -82.634, "vol2011": 23664830 },
         { "name": "Florida: Oviedo Glamour Room", "code": "GLAMOUR ROOM", "city": "Orlando", "state": "FL", "lat": 28.624, "lon": -81.245, "vol2011": 20038679 },
         { "name": "Florida: Miami Doral – Coming Early 2016", "code": "GLAMOUR ROOM", "city": "Orlando", "state": "FL", "lat": 25.819, "lon": -80.335, "vol2011": 19854759 },
         { "name": "California: Hyatt Regency Monterey", "code": "HOTEL AND RESORT SPA", "city": "Orlando", "state": "FL", "lat": 36.592, "lon": -121.874, "vol2011": 19750306 },
         { "name": "California: Manchester Grand Hyatt San Diego", "code": "HOTEL AND RESORT SPA", "city": "Orlando", "state": "FL", "lat": 32.726, "lon": -117.164, "vol2011": 19306660 },
         { "name": "New York: Hyatt Times Square New York", "code": "HOTEL AND RESORT SPA", "city": "Orlando", "state": "FL", "lat": 40.760, "lon": -73.993, "vol2011": 19306660 },
         { "name": "Hawaii: Hyatt Regency Maui", "code": "HOTEL AND RESORT SPA", "city": "Orlando", "state": "FL", "lat": 20.912, "lon": -156.692, "vol2011": 19306660 },
        ];

    $scope.loc = { lat: currrentLocation.Latitude, lon: currrentLocation.Longitude };
    $scope.gotoCurrentLocation = function () {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var c = position.coords;
                $scope.gotoLocation(c.latitude, c.longitude);
            });
            return true;
        }
        return false;
    };
    $scope.gotoCurrentLocation();
    $scope.gotoLocation = function (lat, lon) {
            $scope.loc = { lat: lat, lon: lon };
            if (!$scope.$$phase) $scope.$apply("loc");
    };
}]);
