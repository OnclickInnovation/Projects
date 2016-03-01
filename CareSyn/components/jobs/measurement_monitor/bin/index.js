'use strict';

var mailer = require('../../../../emails');

module.exports.checkByAPI = require('./checkByAPI');
module.exports.sendMonitorStatEmail = require('./sendMonitorStatEmail');
module.exports.sendMissedEmail = mailer.sendMissedMonitorMail;
module.exports.sendOutOfRangeEmail = mailer.sendOverflowMonitorMail;
module.exports.isAPIDataMissed = require('./isAPIDataMissed');
module.exports.isAPIDataOutofBound = require('./isAPIDataOutofBound');
module.exports.updateAndReset = require('./updateAndReset');
module.exports.setProcessed = require('./setProcessed');
module.exports.getReceiverEmails = require('./getReceiverEmails');
