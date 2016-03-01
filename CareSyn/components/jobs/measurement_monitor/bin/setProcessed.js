'use strict';

module.exports = function(measurement){
    return measurement.updateAttributes({
            process_time: new Date()
        });
};
