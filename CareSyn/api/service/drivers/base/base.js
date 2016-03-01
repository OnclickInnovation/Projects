var _ = require('lodash');

function Provider(config){
    config = config || {};

    this.name = config.name;
    this.url  = config.url;
    this.display = config.display;
    this.version = config.version;
    this.description = config.description;
    this.config = config.config;
    this.provides = [];
}

Provider.prototype.addMeasurement = function(measurement){
  this.provides.push(measurement);
  return this;
};

Provider.prototype.getConfig = function(){
    return _.omit({
        name : this.name,
        url : this.url,
        display  : this.display,
        version : this.version,
        description : this.description,
        config : this.config,
        provides : this.provides
      },function(v){
        return v === null || v === undefined;
      });
};


module.exports = {
  Provider : Provider
};
