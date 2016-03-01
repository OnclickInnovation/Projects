'use strict';

var _ = require('lodash');
var serviceMap = require('../components/servicemap/servicelist');

module.exports = {
    marshal: function (OauthMonitorTokenModel) {

          var obj = OauthMonitorTokenModel.toJSON();
          return {
            id: OauthMonitorTokenModel.id,
            monitor_id: OauthMonitorTokenModel.monitor_id,
            service_name: OauthMonitorTokenModel.service_name,
            displayName:  serviceMap.getService(OauthMonitorTokenModel.service_name).display,
          };
    }
};
