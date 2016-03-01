angular
.module('gifts', ['booker.service.book'])
.controller('giftCertificateController', ['$scope', '$location', '$interval', 'booker.service.book.BookerService', function($scope, $location, $interval, BookerService){

  if(sessionStorage.User == "null" || !sessionStorage.User)
  {
    $location.path('/login');
  }
  $scope.templateID = null;
  $scope.$emit('wait:start');
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
          console.log(data);
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
   $scope.proceed = function(template){
    console.log(template);
    if(template)
    {
     sessionStorage.template =  JSON.stringify(template);
     $location.path('/giftDetails');
    }
   }
}]);
