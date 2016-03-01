'use strict';

var baseUrl = require('config').get('server.baseUrl');

var reqMock = {
  protocol: 'http',
  get: function(){
    return baseUrl;
  }
};

module.exports = reqMock;
