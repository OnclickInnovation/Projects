var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Q = require('q');

var basename = path.basename(module.filename);

//these files will be ignored from service lookup
var scanIgnore = ["base",basename];

//file which hold drivers measurement details
var detailsModule = 'provides.js';

exports.readServices = function(){

  var deferred = Q.defer();

  //read all drivers except base
  fs.readdir(__dirname,function(err,files){

    if(err){
      deferred.reject(err); return;
    }

    var drivers = [];

    _.difference(files,scanIgnore)
     .forEach(function(file) {
        var fileName = path.join(__dirname,file,detailsModule);
        var exists = fs.existsSync(fileName);

        if(!exists){
          console.log(file + " Driver doesn't have any information about measurements");
        } else {
          drivers.push(require('./' + file + '/' + detailsModule));
        }
      });

    deferred.resolve(drivers);

  });

  return deferred.promise;

};
