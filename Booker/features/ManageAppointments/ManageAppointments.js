angular.module('manageAppointments', ['booker.service.book'])
.controller('manageAppointmentController', ['$scope', '$location', '$routeParams', '$uibModal', 'booker.service.book.BookerService', function($scope, $location, $routeParams, $modal, BookerService){
    if(!sessionStorage.User)
    {
        $location.path('/login');
    }
    $scope.fetchAppointments = function()
        {
            $scope.$emit('wait:start');
            BookerService
            .getAccessTokenFromSS()
            .then(function(access_token){
                    var input = {
                        CustomerID: User.CustomerID,
                        access_token: User.access_token
                    };
                    BookerService
                    .getCustomerAppointments(input)
                    .then(function(data){
                        console.log(data);
                        $scope.$emit('wait:stop');
                        $scope.appointments = data;
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
        };
    if(sessionStorage.User != "null")
    {
        var User = JSON.parse(sessionStorage.User);
        if(!User)
        {
            $location.path('/login');
        }        
        $scope.fetchAppointments();
    }
    
    $scope.openModal = function(appointment){
        var modalInstance = $modal.open({
            templateUrl: 'features/ManageAppointments/appointmentDetails.html',
              controller: 'ModalInstanceCtrl',
              size: 'sm',
              windowClass: 'center-modal',
              resolve: {
                appointment: function () {
                  return appointment;
                }
              }
        });

        modalInstance.result.then(function (reload) {
              if(reload)
              {
                $scope.$emit("notification", {
                    type: 'success',
                    message: "Appointment Cancellation successful."
                });
                $scope.fetchAppointments();
              }
           }, function () {});
    };
}])
.controller('ModalInstanceCtrl', ['$scope', '$uibModalInstance', 'appointment', 'booker.service.book.BookerService', function($scope, $uibModalInstance, appointment, BookerService){
    $scope.appointment = appointment;
    var brac = $scope.appointment.StartDateTime.indexOf('(') + 1;
    var minus = $scope.appointment.StartDateTime.indexOf(')');
    var date = new Date(parseInt($scope.appointment.StartDateTime.slice(brac, minus)));
    $scope.appointmentStartTime = date;
    $scope.close = function(){
        $uibModalInstance.dismiss();
    }
    $scope.cancel = function(){
        if(!sessionStorage.User)
        {
            $location.path('/login');
            return;
        }
        if(sessionStorage.User != 'null')
        {
            var responce = confirm('Are You Sure, You want to Cancel Booking ??');
            var User = JSON.parse(sessionStorage.User);
            if(responce)
            {
                var input = {
                    ID: appointment.ID,
                    access_token: User.access_token
                };
                $scope.$emit('wait:start');
                BookerService
                .cancelAppointment(input)
                .then(function(data){
                    if(data.IsSuccess){
                        $scope.$emit('wait:stop');
                        $uibModalInstance.close(true);
                    }
                    else{
                        $scope.$emit("notification", {
                            type: 'danger',
                            message: "Appointment Cancellation unsuccessful."
                        });   
                    }
                })
                .catch(function(err){
                    $scope.$emit('wait:stop');
                    $uibModalInstance.close(true);
                    $scope.$emit("notification", {
                            type: 'danger',
                            message: "An Unexpected Error Occured"
                        });
                    console.log(JSON.stringify(err));
                });
            }
        }
    }
}]);
