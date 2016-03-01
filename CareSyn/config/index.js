'use strict';

module.exports = function(app){
  //Express server setup
  require('./express')(app);

  require('logger').info("Express: Setup Done");
}
