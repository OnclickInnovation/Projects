angular.module('synsorcare.directives.datepicker',['ui.bootstrap.datepicker'])
       .directive('datepickerAddon',['$timeout',function($timeout){
         return {
           restrict : 'A',
           scope : {
             'currentDate' : "="
           },
           link : function(scope, elm){

               $timeout(function(){
                 var popup = elm.find('[datepicker]');

                 var dpCont = angular.element(popup).controller('datepicker');
                 var dpScope = angular.element(popup).isolateScope();

                 var watch = dpScope.$watch(function(){
                    return dpCont.activeDate;
                  },function(newVal,oldVal){
                      scope.currentDate = newVal;
                    });

                //remove the watcher
                dpScope.$on('destroy',function(){
                    watch();
                });
              }, 0);

           }
         };
       }])
