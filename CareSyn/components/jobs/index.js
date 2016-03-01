'use strict';

var schedule = require('node-schedule');
var logger = require('logger');
var measurement_monitor = require('./measurement_monitor');

/**
 * Run a function (Promise) every midnight
 *
 * @param  Promise task , the task to run
 *
 */
exports.everyMidnight = function(task, success, failure){
      //set cron job to execute on 7:00 AM
      var rule = new schedule.RecurrenceRule();
      rule.hour = 7;
      rule.minute = 1; // its important to set minute to atleast 0
      var Job = schedule.scheduleJob(rule, function(){
          task()
          .then(function(d){
            success(d);
          })
          .catch(function(e){
            logger.error(e);
            failure(e);
          });
      });

      Job.on('run', function(){
          logger.debug('Started a cron job.');
          success();
      });

      Job.on('canceled', function(){
          logger.warn('Cron job has been cancelled.');
      });

};

exports.registerAll = function(){
    //monitor.beginExecution();
    measurement_monitor.beginExecution();
};
