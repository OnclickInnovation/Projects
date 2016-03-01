angular.module('synsorcare.components.wait', [])
    .directive('wait', ['synsorcare.components.wait.WaitService', function (WaitService) {
        return {
            restrict: 'A',
            scope: {
                wait: '='
            },
            link: function ($scope, $element) {
                $scope.$on('$destroy', function () {
                    WaitService.stop($element);
                });
                $scope.$watch('wait', function () {
                    if($scope.wait) {
                        WaitService.start($element);
                    } else {
                        WaitService.forceStop($element);
                    }
                });
            }
        };
    }])
    .service('synsorcare.components.wait.WaitService', [function () {
        return {

            defaultTarget: 'body',

            defaultOpts: {
                lines: 13, // The number of lines to draw
                length: 20, // The length of each line
                width: 10, // The line thickness
                radius: 30, // The radius of the inner circle
                corners: 1, // Corner roundness (0..1)
                rotate: 0, // The rotation offset
                direction: 1, // 1: clockwise, -1: counterclockwise
                color: '#000', // #rgb or #rrggbb or array of colors
                speed: 1, // Rounds per second
                trail: 60, // Afterglow percentage
                shadow: false, // Whether to render a shadow
                hwaccel: false, // Whether to use hardware acceleration
                className: 'spinner', // The CSS class to assign to the spinner
                zIndex: 2e9, // The z-index (defaults to 2000000000)
                top: 'auto', // Top position relative to parent in px
                left: 'auto' // Left position relative to parent in px
            },
            targetOpts: {
                length: 10,
                radius: 10,
                width: 4
            },

            start: function (target) {
                var passedTarget = target;
                var opts = $.extend({}, this.defaultOpts);
                if(target) {
                   $.extend(opts, this.targetOpts);
                }
                if(!target) {
                    target = $(this.defaultTarget);
                }
                if(!target.data('spinner')) {
                    target.data('spinner', new Spinner(opts));
                    var overlay = $("<div class='overlay'></div>");
                    if(!passedTarget) {
                        overlay.attr('id', 'overlay');
                    }
                    target.data('overlay', overlay);
                    target.data('waiting', 0);
                }
                if(!target.data('waiting')) {
                    target.data('overlay').appendTo(target);
                    target.data('spinner').spin(target.data('overlay')[0]);
                }
                target.data('waiting', target.data('waiting') + 1);
            },
            stop: function (target) {
                if(!target) {
                    target = $(this.defaultTarget);
                }
                target.data('waiting', target.data('waiting') - 1);
                if(target.data('waiting') < 0) { target.data('waiting', 0); }
                if(target.data('waiting') === 0 && target.data('overlay')) {
                    target.data('overlay').detach();
                    target.data('spinner').stop();
                }
            },
            forceStop: function (target) {
                if(!target) {
                    target = $(this.defaultTarget);
                }
                target.data('waiting', 0);
                this.stop(target);
            }
        };
    }]);
