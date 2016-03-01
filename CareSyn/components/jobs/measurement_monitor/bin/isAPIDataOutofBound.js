'use strict';

var Q = require('q');
var isOutOfBoundRule = require('../../../../rules/monitor').isOutOfBound;

/**
 * Check from the readings if the any reading was out of range
 *
 * Resolve(true, reading) : yes some blocks reading was out of bound
 * Resolve(false, reading) : Data was perfect and no one was out of range
 * Reject(error) : Error state
 */
module.exports = function(readings, upperbound, lowerbound, sensitivity){
    var deferred = Q.defer();
    var isOut, outofBoundReading;

    //by default sensitivity is 1 , means ignore no invalid reading
    sensitivity = sensitivity || 1;

    //track how many out of bound readings have gone
    var counter = 0;

    for(var i = 0; i < readings.length; i++)
    {
      isOut = isOutOfBoundRule(upperbound, lowerbound, readings[i].value);

      if(isOut)
      {
          counter++;
          outofBoundReading = readings[i];
          if(counter >= sensitivity){
              break;
          }
      }
      else {
          counter = 0;
          //get latest reading
          outofBoundReading = readings[0];
      }
    }

    deferred.resolve([isOut, outofBoundReading]);
    return deferred.promise;
};
