angular.module('AuraDropdownModule',['ui.bootstrap'])
.controller('AuraDropdownController',['$scope',function($scope){

  $scope.select = function(value){
    if($scope.keyIndex){
      $scope.selected = value[$scope.keyIndex];
    } else {
      $scope.selected = value;
    }
  };

  var arraySearch = function(arr,key,val) {
    if(arr)
    {
        for (var i=0; i < arr.length; i++){
            if (arr[i][key] == val)
                return arr[i];
        }

    }
    return false;

};

  $scope.getOption = function(value){
      return $scope.itemIndex ? value[$scope.itemIndex] : value;
  };

  $scope.getSelected = function(){
    var item = $scope.keyIndex ? arraySearch($scope.items, $scope.keyIndex, $scope.selected) : $scope.selected;
      return $scope.getOption(item);
  };

}])
.directive('auraDropdown', function () {
    return {
        restrict: 'E',
        templateUrl: "javascripts/app/directives/dropdown/dropdown.html",
        scope: {
          selected: "=selected",
          items: "=items",
          keyIndex: "@key",
          itemIndex: "@item"
        },
        controller:"AuraDropdownController"
    }
});
