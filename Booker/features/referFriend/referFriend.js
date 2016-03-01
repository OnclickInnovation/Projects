angular
.module('referFriend', ['booker.service.book', "ngCordova"])
.controller('referFriendController', ['$scope', '$location', 'booker.service.book.BookerService', '$cordovaOauth', '$http', function($scope, $location, BookerService, $cordovaOauth, $http){
    $scope.sms = function(){
        $location.path('/referDetails/false');
    }
    $scope.email = function(){
        $location.path('/referDetails/true');   
    }
}])
.controller('referDetailsController', ['$scope', '$location', 'booker.service.book.BookerService',  '$routeParams', function($scope, $location, BookerService, $routeParams){
    $scope.emailRec = "";
   if($routeParams.email == 'false')
    {
        $scope.email = false;
    }
    else
    {
        $scope.email = true;
    }
    $scope.cancel = function(){
        $location.path('/booking');
    }
    $scope.sendEmail = function(){
        var input = {
            'to': $scope.emailRec
        }
        BookerService
        .sendReferralMail(input)
        .then(function(data){
            if(data){
                $scope.$emit('notification', {
                    type:'success',
                    "message": "Referral Email Sent"
                });
            }
        })
        .catch(function(err){
            $scope.$emit('notification', {
                type:'danger',
                "message": "Unable to send Referral Email"
            })
        });
    }
}]);

