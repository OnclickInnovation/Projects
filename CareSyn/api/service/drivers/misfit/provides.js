var Provider = require('../base/base').Provider;

var config = {
    name: 'misfit',
    url: 'http://www.misfit.com',
    display: 'Misfit',
    version: 2
};

function misfitProvider(config){
  Provider.call(this, config);
}

require('util').inherits(misfitProvider, Provider);

var currentProvider = new misfitProvider(config);

currentProvider
.addMeasurement("sleep")
.addMeasurement("steps");

/* Tell what services does this driver provides */
module.exports = currentProvider.getConfig();
