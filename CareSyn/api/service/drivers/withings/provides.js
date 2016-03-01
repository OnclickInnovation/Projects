'use strict';

var Provider = require('../base/base').Provider;

var config = {
    name: 'withings',
    url: 'http://www.withings.com',
    display: 'Withings',
    version: 1
};

function WithingsProvider(config){
  Provider.call(this, config);
}

require('util').inherits(WithingsProvider, Provider);

var currentProvider = new WithingsProvider(config);

currentProvider
.addMeasurement("steps")
.addMeasurement("weight")
.addMeasurement("blood pressure");
//.addMeasurement("heartbeat");

/* Tell what services does this driver provides */
module.exports = currentProvider.getConfig();
