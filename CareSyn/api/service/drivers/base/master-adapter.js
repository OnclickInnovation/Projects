//global wrapper for all the responses send via drivers
exports.buildAdapter = function(results,driver,message){
  return {
    data : results,
    driver : driver,
    message : message
  }
}
