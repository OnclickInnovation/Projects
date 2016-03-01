"use strict";

var express = require('express');
var router = express.Router();

var config = require('config');
var models = require('models');
var UserModel = models.User,
    PasswordTokenModel = models.PasswordToken;

var _ = require('lodash'),
    crypto = require('crypto');

var mailer = require('../../emails');

/** config phase **/
var EXPIRE_MINS = config.get('password_reset_code_expire');
/** config phase ends **/


router.post('/send/:email', function(req, res){
    var email = req.params.email;

    UserModel
    .findOne({
      where: {
        email: email,
        role_id: config.seeds.roles.Admin
      }
    }).then(function(user){

      if(_.isEmpty(user)){
          return res.status(404).send("No Admin found with this email.");
      }

      crypto.randomBytes(32, function(ex, buf) {
        var hash = buf.toString('hex');

        PasswordTokenModel
          .upsert({
            user_id: user.id,
            hash: hash,
            expires: parseInt(( (new Date).getTime() / 1000 + (EXPIRE_MINS * 60)))
          })
          .then(function(){
              mailer.sendForgotPasswordMail(email, hash).then(function(){
                  //send the reset link
                  return res.status(200).send("Password reset instructions sent to your email.");
              })
              .catch(function(err){
                  console.error(err);
                  //send the reset link
                  return res.status(500).send("Unable to send email.");
              });
          })
          .catch(function(err){
            console.error(err);
            return res.status(500).send("Unable to generate secure token.");
          });
      });

    }).catch(function(err){
        console.error(err);
        return res.status(500).send("Error looking up records.");
    });

});


router.post('/reset', function(req, res){
    var data = req.body.data;

    if(_.isEmpty(data)){
        return res.status(400).send("No Data Supplied");
    }

    UserModel
    .findOne({
      where: {
        email: data.email,
        role_id: config.seeds.roles.Admin
      }
    })
    .then(function(user){

      if(_.isEmpty(user)){
          return res.status(404).send("No Admin found with this email.");
      }

      //find the token
      PasswordTokenModel
      .findOne({
        where: {
          user_id: user.id,
          hash: data.code
        }
      })
      .then(function(tokenData){

        if(_.isEmpty(tokenData)){
            return res.status(400).send("Code is invalid.");
        }

        var currentTime = parseInt((new Date).getTime() / 1000);

        if(tokenData.expires < currentTime){
          return res.status(400).send("Code is already expired.");
        }

        //hash the password
        UserModel.hashPassword(data.newPassword)
                //update password
                .then(function(hashedPassword){
                  return user.updateAttributes({password: hashedPassword });
                })
                //delete the token
                .then(function(){
                  return PasswordTokenModel.destroy({
                    where: {
                      user_id: user.id
                    }
                  });
                })

                //done
                .then(function(){
                  return res.status(200).send("Password reset successful.");
                })
                .catch(function(err){
                  console.error(err);
                  return res.status(500).send("Password reset failed.");
                });
        })
        .catch(function(err){
          console.error(err);
          return res.status(500).send("Code not found.");
        });
    })
    .catch(function(err){
       console.error(err);
       return res.status(500).send("Error looking up records.");
    });
});

module.exports = router;
