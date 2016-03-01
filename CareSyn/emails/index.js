"use strict";
//get the mailer object
var nodemailer = require('nodemailer');
var config = require('config');
var moment = require('moment');
var Q = require('q');
var logger = require('logger');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport(config.get('email.nodemailer'));

// Boolean | mockEmails  , check whether email has to send or not
var mockEmails = config.get('email.mock');

// setup e-mail data
var getmailOptions = function(){
return {
  from: config.get('email.admin.identity'),
  to: null,
  subject: 'SynsorCare',
  html: null
  };
};

var sendEmail = function(options){
  var deferred = Q.defer();
  if(!mockEmails){
  transporter.sendMail(options, function(err, results){
    if(err){
        logger.error("Email failed for : " + options.to + " at " + new Date());
        logger.debug("Error was " + err);
        deferred.reject(err);
    } else {
        logger.debug("Email sent to : " + options.to + " at " + new Date());
        deferred.resolve(results);
    }
  });
  }else{
      logger.debug("Mock Email sent to : " + options.to + " at " + new Date());
      deferred.resolve(true);
  }
  return deferred.promise;
};

/**
* Moniter Details Email
*
* @param monitor | object , @patient_code,description,created_at     , monitor object for which mail is sent
* @param String  | Email  , @to                                      , email address of receiver
*
* @return Promise
*/
exports.sendMonitorEmail = function(monitor, email){
  var opts = getmailOptions();

  opts.to = email;
  opts.subject = 'SynsorMed - New Monitor Code';

  opts.html = '<h3>New Monitor Details</h3>' +
  '<strong>Monitor Code :- </strong>' + monitor.patient_code + '<br/>' +
  '<strong>Monitor Description :- </strong>' + monitor.description + '<br/>' +
  '<strong>Start Date :- </strong>' + moment(monitor.created_at).format("D MMM YYYY : H:m:s").toString() + '<br/>' +
  '<h3>Instructions :-</h3>' +
  '<ol><li><strong>Download The App</strong><ul>' +
  '<li>Go to the app store on your smart phone or tablet</li>' +
  '<li>Apple users will use the Apple App Store</li>' +
  '<li>Android users will use Google Play</li>' +
  '<li>Search for: <b>SynsorMed</b></li>' +
  '<li>Download and install the free app</li>' +
  '</ul></li>' +
  '<li><strong>Login</strong><ul><li>Use the access code above to log into the app</li></ul></li>' +
  '<li><strong>Synsormed Connect</strong><ul><li>Select a service from service list</li><li>Authenticate to external service. You are now conected with Synsormed</li></ul></li>' +
  '<li><strong>Next Reading</strong>' +
  '<ul><li><b>Important</b> : Note your next reading date.</li><li>Make sure to take next reading on or before this date</li></ul></li>' +
  '</ol></div>' + '<div><strong>WARNING</strong><ul>' +
  '<li>In an emergency, DO NOT use the app! Call 911 or go to your nearest Emergency Room!</li>' +
  '<li>Your access code will expire the day after your eVisit</li></ul></div>';

  return sendEmail(opts);
};

/**
* Missed Monitor Email
*
* @param String      | Email   , @to          , email address of provider
* @param String                , @monitorCode , unique code attached with monitor
* @param Date        | String  , @dated       , date when monitor was scheduled to record
* @param Boolean               , @extDate     , boolean for showing timestamp with date or not.
* @param String                , @description , description attached with monitor
*
* @return Promise
*/
exports.sendMissedMonitorMail = function(to, monitorCode, dated, extDate, description){
  var opts = getmailOptions();

  var details = '<br/><b> Description: </b><br/>' + description + '<br/><br/>';
  details = description ? details : '';

  var date = extDate ? moment(dated).format("D MMM YYYY hh a").toString() : moment(dated).format("D MMM YYYY").toString();
  opts.to = to;
  opts.subject = 'SynsorMed - Missed Reading';
  opts.html = 'Patient monitoring code <br/>' +
  '<b>' + monitorCode + '</b> <br/>' +
  'missed a scheduled reading on ' +
  '<b>' + date + '</b><br/>' +
  details +
  'You may use the <a href="http://portal.synsormed.com" >SynsorMed Portal</a> to followup with this patient.';
  return sendEmail(opts);
};

/**
* Out of Bound Monitor Email
*
* @param String      | Email    , @to          , email address of provider
* @param String                 , @monitorCode , unique code attached with monitor
* @param Date        | String   , @dated       , date when monitor reading was taken
* @param String                 , @description , description attached with monitor
*
* @return Promise
*/
exports.sendOverflowMonitorMail = function(to, monitorCode, dated, description){
  var opts = getmailOptions();
  var details = '<br/><b> Description: </b><br/>' + description + '<br/><br/>';

  details = description ? details : '';

  opts.to = to;
  opts.subject = 'SynsorMed - Out of Range Reading';
  opts.html = 'Patient monitoring code <br/>' +
  '<b>' + monitorCode + '</b> <br/>' +
  'recorded an out of range reading on ' +
  '<b>' + moment(dated).format("D MMM YYYY hh a").toString() + '</b><br/>' +
  details +
  'You may use the <a href="http://portal.synsormed.com" >SynsorMed Portal</a> to followup with this patient.';

  return sendEmail(opts);
};

/**
* Send Raw Html Email
*
* @param String | Email   , @to     , email address of provider
* @param String           , @title  , title for the monitor
* @param Date   | String  , @html   , html to send
*
* @return Promise
*/
exports.sendRawMail = function(to, title, html){
  var opts = getmailOptions();

  opts.to = to;
  opts.subject = title;
  opts.html = html;

  return sendEmail(opts);
};


/**
* Send Password Reset Email
*
* @param String | Email , @to     , email address
* @param String         , @hash   , hash to send to user
*
* @return Promise
*/
exports.sendForgotPasswordMail = function(to, hash){
  var opts = getmailOptions();

  opts.to = to;
  opts.subject = 'SynsorMed - Password Reset';
  opts.html = '<div>You are receiving this because you (or someone else) have requested the reset of the password for your account.</div><br />' +
  '<div>Please <b>copy the code below</b> and complete the password restore process on portal.</div>' +
  '<h4>' + hash + '</h4>' +
  '<div>If you did not request this, please ignore this email and your password will remain unchanged.</div><br />' +
  '<div><b>Note :</b> <u>This code will expire in next ' + config.get('password_reset_code_expire') + ' minutes.</u></div><br />' +
  '<div>Thanks!</div>' +
  '<div>SynsorMed Team</div>';

  return sendEmail(opts);
};
