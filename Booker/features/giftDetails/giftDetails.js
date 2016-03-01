angular
.module('giftDetails', ['booker.service.book'])
.controller('giftDetailsController', ['$scope', '$location', '$interval', 'booker.service.book.BookerService', function($scope, $location, $interval, BookerService){

  if(sessionStorage.User == "null" || !sessionStorage.User || !sessionStorage.template)
  {
    $location.path('/login');
  }
  $scope.$emit('wait:start');
  $scope.details = JSON.parse(sessionStorage.template);
  $scope.giftAmount = 100;
   BookerService
   .getAccessToken()
   .then(function(data){
        var access = {
            access_token: data,
            locationID: 21324
        };
        BookerService
        .getGiftTemplates(access)
        .then(function(data){
          $scope.$emit('wait:stop');
          $scope.locations = data.GiftCertificateTemplates;
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
      $scope.$emit("notification", {
            type: 'danger',
            message: err.data || "Server error"
      });
   });
   
   $scope.createCertificate = function(){
      var user = JSON.parse(sessionStorage.User);
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      var email = re.test($scope.giftTo);
      console.log(email);
      if(!$scope.giftTo || !re.test($scope.giftTo))
        {
          $scope.$emit("notification", {
                    type: 'info',
                    message: 'Please Enter a Valid Email Address'
                }); 
          return;
        }

        if($scope.giftAmount < 99)
        {
          $scope.$emit("notification", {
                    type: 'info',
                    message: 'Gift Amount can\'t be less then 100'
                }); 
          return;
        }
        if($scope.giftAmount % 1 != 0)
        {
          $scope.$emit("notification", {
                    type: 'info',
                    message: 'Enter a valid Gift Amount'
                }); 
          return;
        }
      $scope.$emit('wait:start');
      var data = {
        access_token: sessionStorage.accessToken,
        LocationID: sessionStorage.locationID,
        GiftTo: $scope.giftTo,
        GiftFrom: user.Customer.Email,
        GiftMessage: $scope.giftMessage,
        GiftTemplateId: $scope.details.ID,
        Amount: $scope.giftAmount
      }
      console.log(data)
      BookerService
      .createCertificate(data)
      .then(function(data){
        $scope.$emit('wait:stop');
        if(data.GiftCertificateID)
        {
          sessionStorage.gift = JSON.stringify(data);
          sessionStorage.giftAmount = $scope.giftAmount;
          $scope.$emit("notification", {
            type: 'success',
            message: "Gift Create Successful."
          });
          $location.path('/payment/true');
        }
      })
      .catch(function(err){
        $scope.$emit('wait:stop');
        console.log(err);
        $scope.$emit("notification", {
            type: 'danger',
            message: "Please Try again later"
        });
        $location.path('/login');
      })
   };
}]);