'use strict';

var _ = require('lodash');
var units = require('../api/service/drivers/base/units');

module.exports = {
    marshal: function (measurementModel) {

          var obj = measurementModel.toJSON();

          return {
            id: obj.id,
            name: _.capitalize(obj.name),
            unit: units.getUnit(obj.unit, 'en_US') || null
          };
    },
    unmarshal: function (rawData) {
        return rawData;
    }
};
