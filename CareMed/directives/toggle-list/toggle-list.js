angular.module('synsorcare.directives.toggleList',[])
.controller('ToggleListDirectiveController',['$scope',function($scope){
  $scope.visible = false;
  $scope.toggle = function(){
    $scope.visible = !$scope.visible;
  }
}])
.directive('toggleList', function () {
    return {
        restrict: 'E',
        templateUrl: "javascripts/app/directives/toggle-list/toggle-list.html",
        controller:"ToggleListDirectiveController",
        scope : {
          listTitle : "@"
        },
        replace: true,
        transclude: true
    }
});
