angular
.module('rewardPoints', ['booker.service.book'])
.controller('rewardPointsController', ['$scope', '$location', '$routeParams', 'booker.service.book.BookerService',  function($scope, $location, $routeParams, BookerService){
    $scope.$emit('wait:stop');
    if(sessionStorage.User == "null" || !sessionStorage.User)
    {
        sessionStorage.User = null;   
        $location.path('/login');
        return;
    }
    $scope.User= JSON.parse(sessionStorage.User);
    console.log($scope.User.Customer.LoyaltyPoints);
}]);
