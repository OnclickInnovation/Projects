angular
.module('register', ['booker.service.book', "ngCordova"])
.controller('registerController', ['$scope', '$location', 'booker.service.book.BookerService', '$cordovaOauth', '$http', function($scope, $location, BookerService, $cordovaOauth, $http){
    
    $scope.googleLogin = function(){
        $scope.$emit('wait:start');
        BookerService
        .getGoogleId()
        .then(function(data){
            $scope.$emit('wait:stop');
            $cordovaOauth
            .google(window.atob(data), ["profile", "email"])
            .then(function(data){
              var url = 'https://www.googleapis.com/plus/v1/people/me?access_token={' + data.access_token + '}';
              $scope.$emit('wait:start');
                $http({
                    url: 'https://www.googleapis.com/oauth2/v3/userinfo',
                    method: 'GET',
                    params: {
                        access_token: data.access_token
                    }
                })
                .then(function(data){
                    $scope.$emit('wait:stop');
                    $scope.$emit('notification',{
                        type: "success",
                        message: "Google + Profile Fetched Successfully"
                    });
                    var user_data = data.data;
                    var index = user_data.name.indexOf(' ');
                    var fname = user_data.name.slice(0, index);
                    var lname = user_data.name.slice(index + 1, user_data.name.length);
                    var user = {
                        fname: fname,
                        lname: lname,
                        email: user_data.email,
                        phone: user_data.phone ? user_data.phone : null,
                    };
                    $scope.fname = user.fname;
                    $scope.lname = user.lname;
                    $scope.email = user.email;
                    $scope.phone = user.phone ? user.phone : null;
                })
                .catch(function(err){
                    $scope.$emit('wait:stop');
                    $scope.$emit('notification',{
                        type: "danger",
                        message: "Google + Profile Fetch Failed"
                });
                    console.log(err);
                })
            })
            .catch(function(err){
                $scope.$emit('wait:stop');
                $scope.$emit('notification',{
                        type: "danger",
                        message: "Google + Profile Fetch Failed"
                });
                console.log(err);
            });
        })
        .catch(function(err){
            $scope.$emit('wait:stop');
            $scope.$emit('notification',{
                type: "danger",
                message: "Failed to sign in"
            });
            console.log(err);
        })            
    }

    $scope.facebookLogin = function()
    {
        $scope.$emit('wait:start');
         BookerService
        .getFacebookId()
        .then(function(data){
            $scope.$emit('wait:stop');
            $cordovaOauth
            .facebook(window.atob(data), ["email"])
            .then(function(result) {
                $scope.$emit('wait:start');
                $http
                .get("https://graph.facebook.com/v2.2/me?access_token=" + result.access_token + "&fields=id,name,email")
                .then(function(result) {
                    $scope.$emit('wait:stop');
                    $scope.$emit('notification',{
                        type: "success",
                        message: "Facebook Profile Fetched Successfully"
                    });
                    var user_data = result.data;
                    var index = user_data.name.indexOf(' ');
                    var fname = user_data.name.slice(0, index);
                    var lname = user_data.name.slice(index + 1, user_data.name.length);
                    var user = {
                        fname: fname,
                        lname: lname,
                        email: user_data.email,
                        phone: user_data.phone ? user_data.phone : null,
                    };
                    $scope.fname = user.fname;
                    $scope.lname = user.lname;
                    $scope.email = user.email;
                    $scope.phone = user.phone ? user.phone : null;
                }, function(error) {
                    $scope.$emit('wait:stop');
                    $scope.$emit('notification',{
                        type: "danger",
                        message: "Facebook Profile Fetch Failed"
                    });
                    console.log(error.message);
                });
            }, function(error) {
                $scope.$emit('wait:stop');
                $scope.$emit('notification',{
                        type: "danger",
                        message: "Facebook Profile Fetch Failed"
                });
                console.log(error);
            });
        })
        .catch(function(err){
            $scope.$emit('wait:stop');
            $scope.$emit('notification',{
                type: "danger",
                message: "Failed to sign in"
            });
            console.log(error);
        })
    }
    if(sessionStorage.User != undefined)
    {
        $location.path('/booking');
    }
    // Set the default value of inputType
      $scope.inputType = 'password';
      
      // Hide & show password function
      $scope.hideShowPassword = function(){
        console.log($scope.passwordCheckbox);
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
    
    $scope.loginfB = function() {
     FB.login(function(response){
        console.log(response);
        FB.api('/me', function(re){
            console.log(re);
        });
    });
};

    $scope.getLoginStatus = function() {
      Facebook.getLoginStatus(function(response) {
        if(response.status === 'connected') {
          $scope.loggedIn = true;
        } else {
          $scope.loggedIn = false;
        }
      });
    };

    $scope.me = function() {
      Facebook.api('/me', function(response) {
        $scope.user = response;
      });
    };
	
    $scope.$emit('wait:start');
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
            $scope.$emit('wait:stop');
			$scope.locationID = locations[0].ID;
			$scope.locations = locations;
		})
		.catch(function(err){
            $scope.$emit('wait:stop');
            $scope.$emit("notification", {
                type: 'danger',
                message: err.data || "Server error"
            });
			console.log(err);
		});
    })
    .catch(function(err){
        console.log(err);
        $scope.$emit("notification", {
                type: 'danger',
                message: err.data || "Server error"
        });
    });
    $scope.register = function(){
    	 	var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    	 	var email = re.test($scope.email);
    	 	var passwordReg = /^(?=.*\d)(?=.*[a-z])\w{8,25}$/
    	 	var password = passwordReg.test($scope.password);

    		if(!$scope.fname)
    		{
                $scope.$emit("notification", {
                    type: 'info',
                    message: 'Please Enter a Valid First Name'
                });
    			return;
    		}
    		if(!$scope.lname)
    		{
                $scope.$emit("notification", {
                    type: 'info',
                    message: 'Please Enter a Valid Last Name'
                });
    			return;
    		}
    		if(!$scope.email || !re.test($scope.email))
    		{
    			$scope.$emit("notification", {
                    type: 'info',
                    message: 'Please Enter a Valid Email Address'
                });	
    			return;
    		}
    		if(!$scope.password || $scope.password == '' || !passwordReg.test($scope.password))
    		{
                $scope.$emit("notification", {
                    type: 'info',
                    message: 'Please Enter a Valid Password. Password must be at least 8 characters, no more than 25 characters, and must include at least one numeric digit and no alpha numeric characters.'
                });
    			return;
    		}
    		if(!$scope.phone || $scope.phone.length != 10)
    		{
    			$scope.$emit("notification", {
                    type: 'info',
                    message: 'Please Enter a Valid Phone Number'
                }); 
    			return;
    		}
    		var input = {
                "Password": $scope.password,
                "Email": $scope.email,
                "FirstName": $scope.fname,
                "HomePhone": $scope.phone,
                "LastName": $scope.lname,
                "LocationID": $scope.locationID,
                "access_token": $scope.access_token
    		};
            $scope.$emit('wait:start');
    		BookerService
    		.createCustomerAndUserAccount(input)
    		.then(function(data){
                console.log(data.ErrorMessage);
                $scope.$emit('wait:stop');
                if(data.data.IsSuccess)
                {
                    $scope.$emit("notification", {
                        type: 'success',
                        message: 'Account Create Successful'
                    });
                    $location.path('/login');
                }
                else if (data.data.ArgumentErrors || data.data.ErrorMessage)
                {
                    var message = '';
                    if(data.data.ArgumentErrors)
                    {
                        data.data.ArgumentErrors.forEach(function(err){
                        message = message + err.ArgumentName + err.ErrorMessage;
                    })
                        $scope.$emit("notification", {
                            type: 'danger',
                            message: message
                        });    
                    }
                    else{
                        $scope.$emit("notification", {
                            type: 'danger',
                            message: data.data.ErrorMessage
                        });   
                    }
                    
                }
                else
                {
                    $scope.$emit("notification", {
                        type: 'danger',
                        message: 'Server Error'
                    });
                }
    		})
    		.catch(function(err){
                $scope.$emit('wait:stop');
                $scope.$emit("notification", {
                    type: 'danger',
                    message: err.data || "Server error"
                });
    		});
    };
}]);
