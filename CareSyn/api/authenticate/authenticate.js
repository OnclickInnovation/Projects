'use strict';

var models = require('models');
var UserModel = models.User;
var RoleModel = models.Role;
var UserMarshaller = require('../../dto/user');
var CSRFMiddleware = require('../../components/csrf');
var csrf = new CSRFMiddleware();
var express = require('express');
var router = express.Router();
var logger = require('logger');

router.post('/', function (req, res) {
  var email = req.body.username;
  var password = req.body.password;
  logger.debug("Looking up user: " + email);

  UserModel.find({
    where: {
      email: {
        $like: email
      }
    },
    include: [RoleModel]
  }).then(function (user) {

    if(!user) {
      logger.warn("Failed Login Attempt : No user found with email " + email);
      return res.status(401).end();
    }

    var verifyLogin = function(){
      UserModel.verifyPassword(password, user.password).then(function () {
        csrf.attachToSession(req.session, function (token) {
          req.session.userId = user.id;
          req.session.save(function () {
            UserMarshaller.marshal(user)
            .then(function (userJson) {
              res.header('Access-Control-Expose-Headers', 'X-Session-Token');
              res.json({
                user: userJson,
                csrfToken: token
              });
            });
          });
        });
      }).catch(function () {
        logger.warn("Failed Login Attempt : Bad password " + email);
        return res.status(401).end();
      });
    };

    verifyLogin();
    });
});

module.exports = router;
