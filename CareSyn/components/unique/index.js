var Q = require('q');

var MonitorModel   = require('models').Monitor;

//generate a unique code
var makeid = function() {
    var text = "";
    var possible = "ABCDEFGHJKLMNPRSTUVWXYZ23456789";

    for( var i=0; i < 7; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


exports.generateUniqueCode = function(){
    var deferred = Q.defer();
    var code = makeid();

    //if any monitor with this code exists
    MonitorModel.count({where: { patient_code: code }}).then(function (count) {
        if(count === 0) {
                deferred.resolve(code);
        } else {
            exports.generateUniqueCode().then(deferred.resolve);
        }
    })
    .catch(function(e){
      deferred.reject(e);
    });

    return deferred.promise;
  };
