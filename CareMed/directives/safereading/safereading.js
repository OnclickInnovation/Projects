angular.module('synsorcare.directives.safereading', [])
.controller('SafeReadingDirectiveController', ['$scope', '$interval', function($scope){
  var bp0, bp1, bp2, bp3, glu1, glu2;

  var rangeCheck = function(bounds, limits){
      return ((limits[0] <= parseInt(bounds[0])) && (parseInt(bounds[0]) <= limits[1])) && ((limits[0] <= parseInt(bounds[1])) && (parseInt(bounds[1]) <= limits[1]));
  };
    $scope.$watch('measurement.name', function( newValue ) {
      newValue = newValue || '';
      switch(newValue.toLowerCase())
      {
        case "blood pressure":

          //remove old watches over bpslider
          if(bp0 && bp1 && bp2 && bp3)
          {
            bp0(); bp1(); bp2(); bp3();
          }

          $scope.bpslider = {
                min: 90,
                max: 120,
                min1: 60,
                max1: 80,
                ceil: 200,
                floor: 1
            };

            //if editing old monitor then
            if(isNaN($scope.upperbound))
            {
              var upperarr = $scope.upperbound.split('/');
              var lowerarr = $scope.lowerbound.split('/');
              $scope.bpslider.min = parseInt(upperarr[0]) || 90;
              $scope.bpslider.max = parseInt(upperarr[1]) || 120;
              $scope.bpslider.min1 = parseInt(lowerarr[0]) || 60;
              $scope.bpslider.max1 = parseInt(lowerarr[1]) || 80;
            }

            //watch the bp slider bounds and update the upper and lower selected value
            bp0 = $scope.$watch('bpslider.min', function() {
              $scope.upperbound = $scope.bpslider.min + "/" + $scope.bpslider.max;
            });
            bp1 = $scope.$watch('bpslider.max', function() {
              $scope.upperbound = $scope.bpslider.min + "/" + $scope.bpslider.max;
            });
            bp2 = $scope.$watch('bpslider.min1', function() {
              $scope.lowerbound = $scope.bpslider.min1 + "/" + $scope.bpslider.max1;
            });
            bp3 = $scope.$watch('bpslider.max1', function() {
              $scope.lowerbound = $scope.bpslider.min1 + "/" + $scope.bpslider.max1;
            });
            break;

        case "steps":
        case "glucose":
        case "weight":
        case "sleep":
        default:
          //remove old watches over slider
          if(glu1 && glu2)
          {
            glu1(); glu2();
          }

          if(newValue.toLowerCase() == 'steps'){
              $scope.slider = {
                min: 2000,
                max: 10000,
                ceil: 50000,
                floor: 1000
              };
          }
          if(newValue.toLowerCase() == 'sleep'){
              $scope.slider = {
                min: 6,
                max: 10,
                ceil: 24,
                floor: 1
              };
          }
          if(newValue.toLowerCase() == 'glucose'){
              $scope.slider = {
                min: 100,
                max: 125,
                ceil: 200,
                floor: 1
              };
          }
          if(newValue.toLowerCase() == 'weight'){
              $scope.slider = {
                min: 150,
                max: 250,
                ceil: 600,
                floor: 1
              };
          }
          if($scope.lowerbound && $scope.upperbound)
          {
              if(rangeCheck([$scope.lowerbound, $scope.upperbound],[$scope.slider.floor, $scope.slider.ceil]))
              {
                  $scope.slider.min = isNaN($scope.lowerbound) ? $scope.slider.min : parseInt($scope.lowerbound);
                  $scope.slider.max = isNaN($scope.upperbound) ? $scope.slider.max : parseInt($scope.upperbound);
              }
          }
          //watch the slider bounds and update the upper and lower selected value
          glu1 = $scope.$watch('slider.min', function() {
            $scope.lowerbound = $scope.slider.min;
          });

          glu2 = $scope.$watch('slider.max', function() {
            $scope.upperbound = $scope.slider.max;
          });
          break;

         }
      });
}])
.directive('safeReading', function () {
    return {
        restrict: 'E',
        templateUrl: "javascripts/app/directives/safereading/safereading.html",
        controller: "SafeReadingDirectiveController",
        scope: {
          measurement: '=measurement',
           upperbound: '=upperbound',
           lowerbound: '=lowerbound'
        }
    };
});
