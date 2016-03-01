'use strict';

/** search a value in range , return true if found otherwise false **/
var valueCheck = function(max, min, latest){
  max = parseInt(max); min = parseInt(min); latest = parseInt(latest);
  return latest ? (min <= latest && latest <= max && min <= max) : false;
};

module.exports = function(upperbound, lowerbound, latest_reading){

  if(upperbound && lowerbound){

   if(upperbound.indexOf('/') === -1)
    {
      // If  no `/` found
      return latest_reading ?
      !valueCheck(upperbound, lowerbound, latest_reading)
      : false;
    }
    else
    {
      if(!latest_reading){
        return false;
      }

      // If `/` found split the values in array's
      var upperarr = upperbound.split('/');
      var lowerarr = lowerbound.split('/');
      var latestarr = latest_reading.split('/');
      return !(valueCheck(upperarr[1], upperarr[0], latestarr[0]) && valueCheck(lowerarr[1], lowerarr[0], latestarr[1]));
    }
  } else {
    return false;
  }
};
