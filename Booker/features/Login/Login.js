angular
.module('login', ['booker.service.book'])
.controller('loginController', ['$rootScope', '$scope', '$location', 'booker.service.book.BookerService', function($rootScope, $scope, $location, BookerService){
	if(sessionStorage.User != undefined)
	{
		$location.path('/booking');
	}
	$scope.username = null;
	$scope.password = null;
	$scope.$emit('wait:start');
	// Set the default value of inputType
	  $scope.inputType = 'password';
	  
	  // Hide & show password function
	  $scope.hideShowPassword = function(){
	    if ($scope.inputType == 'password')
	      $scope.inputType = 'text';
	    else
	      $scope.inputType = 'password';
	  };
	  $scope.hideShowPasswordText = function(){
        if ($scope.inputType == 'password')
          $scope.inputType = 'text';
        else
          $scope.inputType = 'password';
        if ($scope.passwordCheckbox == true)
          $scope.passwordCheckbox = false;
        else
          $scope.passwordCheckbox = true;
      }
	BookerService
    .getAccessTokenFromSS()
    .then(function(access_token){


    	$scope.access_token = access_token;
    	
    	var input = {
    		access_token: access_token
    	};
    	
    	BookerService
		.getLocations(input)
		.then(function(locations){
			console.log(locations);
			$scope.$emit('wait:stop');
			$scope.locationID = locations[0].ID;
			$scope.locations = locations;
			console.log('$rootScope.alreadyLoggedIn');
			console.log($rootScope.alreadyLoggedIn)
			if($rootScope.alreadyLoggedIn)
			{
				var user = JSON.parse(localStorage.getItem("UserCridentials"));
				console.log(user)
				if(user)
				{
					$scope.username = user.Email;
					$scope.password= user.Password;
					$scope.locationID = user.LocationID;
					$scope.login();			
				}
			}
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
	$scope.login = function(){
		if($scope.username=='' || !$scope.username)
		{
			$scope.$emit("notification", {
                    type: 'info',
                    message: 'Enter a valid Username/E-mail'
                });
			return;
		}
		if($scope.password== '' || !$scope.password)
		{
			$scope.$emit("notification", {
                    type: 'info',
                    message: 'Enter a valid Password'
                });
			return;
		}

		var data = {
			"Email": $scope.username,
			"Password": $scope.password,
			"LocationID": $scope.locationID
		}
		$scope.$emit('wait:start');
		BookerService
		.login(data)
		.then(function(data){
			$scope.$emit('wait:stop');
			if(!data.data.error)
			{
				console.log('OK NOW I WILL  EMIT THE LOGIN')
				$scope.$emit('user:loggedIn');
				var userCridentials = JSON.stringify({
					"Email": $scope.username,
					"Password": $scope.password,
					"LocationID": $scope.locationID
				});
				if(localStorage)
				{
					localStorage.setItem('UserCridentials', userCridentials);
					console.log(localStorage.getItem("UserCridentials"));
				}
				$rootScope.loggedIn = true;
				data.data.Customer.access_token = data.data.access_token;
				var customerData = data.data.Customer;
				sessionStorage.setItem('User', JSON.stringify(customerData));
				sessionStorage.setItem('locationID', 21324);
				if(sessionStorage.IncompleteAppointmentID)
    			{
    				$location.path('/payment/false');
    			}
    			else
    			{
    				$location.path('/manage');
    			}
			}
			else{
				$scope.$emit("notification", {
		            type: 'danger',
		            message: data.data.error || "Server error"
		        });
			}
		})
		.catch(function(err){
			$scope.$emit('wait:stop');
			$scope.$emit("notification", {
		        type: 'danger',
		        message: err.data || "Server error"
		    });
			console.log(err);
		});
	}
}]);
