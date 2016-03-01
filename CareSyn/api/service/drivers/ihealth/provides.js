var Provider = require('../base/base').Provider;

var config = {
    name: 'ihealth',
    url: 'http://www.ihealth.com',
    display: 'iHealth',
    version: 2
};

function iHealthProvider(config){
  Provider.call(this, config);
}

require('util').inherits(iHealthProvider, Provider);

var currentProvider = new iHealthProvider(config);

currentProvider
.addMeasurement("glucose")
.addMeasurement("weight")
.addMeasurement("blood pressure")
.addMeasurement("steps");

/* Tell what services does this driver provides */
module.exports = currentProvider.getConfig();
