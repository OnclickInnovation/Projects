angular.module('services', ['booker.service.book'])
.controller('serviceController', ['$scope', '$location', '$routeParams', 'booker.service.book.BookerService', function($scope, $location, $routeParams, BookerService){
    $scope.locationID = $routeParams.locationId;

    $scope.$emit('wait:start');
    $scope.categories = [];
    $scope.filterSelected = [];
    $scope.changed = function(service){
        if(service.selected)
        {
            service.selected = false;
        }
        else{
            service.selected = true;
        }
    };
    $scope.showServices = function(){
        if($scope.filterSelected.length > 0){
            sessionStorage.selectedServices = JSON.stringify($scope.filterSelected);
            sessionStorage.serviceLocationID = JSON.stringify($scope.locationID);
            $location.path('/availability');
        }
        else
        {
            $scope.$emit("notification", {
                type: 'info',
                message: "Please select a service to continue"
            });
        }
    };
    $scope.$watch('services', function(newVal, oldVal){
        if(newVal != oldVal){
            $scope.filterSelected = _.filter($scope.services, {"selected": true});
        }
    }, true);

    BookerService
    .getAccessTokenFromSS()
    .then(function(access_token){
        if($routeParams.locationId)
        {
            var input = {
                LocationID: $routeParams.locationId,
                access_token: access_token
            };
    
            BookerService
            .findTreatments(input)
            .then(function(data){
                $scope.$emit('wait:stop');
                data.forEach(function(val){
                    $scope.categories.push(val.Category.Name);
                });
                $scope.categories = _.uniq($scope.categories);
                $scope.selectedCategory = $scope.categories[0];
                $scope.services = data;
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
    })
    .catch(function(err){
        $scope.$emit("notification", {
            type: 'danger',
            message: err.data || "Server error"
        });
    });
}]);
