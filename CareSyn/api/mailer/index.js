'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var logger = require('logger');

var UserModel = require('models').User;

//get the mailer object
var mailer = require('../../emails');
var MonitorModel = require('../../../models').Monitor;

router.use(function (req, res, next) {
  UserModel.findById(req.session.userId)
  .then(function (user) {
    if (!user) {
      req.status(404).end();
    }
    req.currentUser = user;
    next();
  })
  .catch(function(){
    return res.status(500).send("Synsormed Login Details Invalid.");
  });
});

/**
* API for sending email with data supplied
*
* @param String username     , required
* @param String password     , required
* @param String | Array data , required
*
* @return Boolean
*/
router.post('/', function (req, res) {

  var data = req.body,
  formData = data.data;

  //check if data exists and not empty
  if(_.isEmpty(formData)){
    return res.status(500).send("Form data missing.");
  }

  if(typeof formData !== 'object'){
    return res.send(500, "Form data invalid.");
  }

  var htmlString = 'A new request has been registered. These are the details : <br /> <br />';

  for(var key in formData){

    var tmp = formData[key];

    if(!_.isEmpty(tmp)){
      htmlString += "<b>" + key + " : </b>" + tmp + "<br />";
    }
  }

  //if string cant be generated then return error
  if(htmlString === false){
    return res.status(500).send("Form data invalid.");
  }

  htmlString = 'Hello , <br /><br />' + htmlString + "<br /> Thanks!";

  mailer
  .sendRawMail(req.currentUser.email, 'Request Confirmed', htmlString)
  .then(function(response){
    logger.info("Email Sent for Form Data");
    logger.debug(response);
  })
  .catch(function(e){
    logger.log("Error while sending email for Form Data");
    logger.error(e);
  });

  return res.status(200).json(true);
});

//middleware to check if a user is logged in
//and allow only logged in user to continue.
var logedInCheck = function(req, res, next)
{
  if(_.isEmpty(req.currentUser))
  {
    return res.status(403).send('Unautherized access');
  }
  else {
    next();
  }
};

/**
* API for sending email for monitor details
*
* @param Integer id     , required
* @param String email   , required
*
* @return Boolean
*/
router.post('/monitor', logedInCheck, function (req, res) {

  if(_.isEmpty(req.currentUser))
  {
    return res.status(403).send('Unautherized access');
  }

  MonitorModel.findById(req.body.id)
  .then(function(monitor){
    if(!monitor || !req.body.email)
    {
      return res.status(401).send('Wrong Request');
    }
    mailer.sendMonitorEmail(monitor, req.body.email)
    .then(function(response){
      logger.info("Email Sent for Form Data");
      logger.debug(response);
      return res.status(200).json(true);
    })
    .catch(function(e){
      logger.log("Error while sending email for Form Data");
      logger.error(e);
      return res.status(500).error(e);
    });
  });

});
module.exports = router;
