"use strict";

var router = require('express').Router();
var UserModel = require('models').User;
var UserPreferenceModel = require('models').UserPreference;
var RoleModel = require('models').Role;
var UserMarshaller = require('../../../dto/user');
var Q = require('q');
var config = require('config');

var adminRoleId = config.get('seeds.roles.Admin'),
    providerRoleId = config.get('seeds.roles.Provider');

router.use(function (req, res, next) {
    UserModel.find({
      where: {id: req.session.userId},
      include: [RoleModel]
    }).then(function (user) {
        if (!user) {
            res.status(404).end();
        }
        req.currentUser = user;
        next();
    }).catch(function (err) {
      console.log("ERROR: ", err)
      res.status(500).end();
    });
});

router.get('/', function (req, res, next) {
    UserModel.findAll().then(function (users) {
        var promises = [];
        var userData = [];
        users.map(function (user) {
            var promise = UserMarshaller.marshal(user);
            promises.push(promise.then(function (userJSON) {
                userData.push(userJSON);
            }));
        });

        return Q.all(promises).then(function () {
            res.json(userData);
        }).catch(function (e) {
            console.log(e);
            return res.status(500).send(e);
        });
    }).catch(function (e) {
        console.log(e);
      return res.status(500).end();
    });
});

router.post('/', function (req, res) {
    var userData = req.body;
    //check if email already present
    UserModel
    .find({where: {'email': req.body.email}})
    .then(function(user){
      // if user with same email found
      if(user)
      {
        // return 409 -> already used email
        return res.status(409).send('Email already registered');
      }
      // if user with same email not found
      else
      {
        // create a new user
        RoleModel.find({
          where: {
            name: req.body.role
          }
        }).then(function (role) {
          userData.role_id = role.id;
        }).then(function () {
          return UserModel.hashPassword(userData.password);
        }).then(function (hash) {
          userData.password = hash;
          userData.registration_date = new Date();
          return UserModel.create(userData).then(function (user) {
            return UserMarshaller.marshal(user).then(function (user) {
              res.json(user);
            });
          }).catch(function (err) {
            return res.status(500).send(err);
          });
        });
      }
    });
});


var userRouter = require('express').Router({mergeParams: true});

userRouter.delete('/', function (req, res) {

    if(req.currentUser.role_id !== adminRoleId){
        return req.status(401).end();
    }

    req.user.destroy().then(function () {
        return res.send();
    }).catch(function (err) {
      return res.status(500).send(err);
    });

});

userRouter.put('/', function (req, res) {
    if(req.currentUser.role_id !== adminRoleId && (req.currentUser.id !== req.user.id && req.currentUser.role_id !== providerRoleId)) {
        return res.status(401).end();
    }

    UserModel
    .find({where: {'email': req.body.email}})
    .then(function(user){
      // if user with same email found
      var userData = UserMarshaller.unmarshal(req.body);

      if(user && (user.id !== req.user.id))
      {
          //already used email
          return res.status(409).send();
      }

      delete req.body.org_id;
      if(req.currentUser.role_id !== adminRoleId) {
          delete userData.role;
          delete userData.email;
      }

      var userData = userData;
      delete userData._id;
      UserPreferenceModel.findOrCreate({
        where: {
          user_id: userData.id,
          key: 'reportingEmails'
        }
      }).spread(function (pref) {
        return pref.update({
          value: userData.reportingEmails
        });
    });

      require('models').sequelize.Promise.resolve().then(function () {
        if(userData.role) {
          return RoleModel.find({where: {name: userData.role}}).then(function (role) {
            userData.role_id = role.id;
          });
        }
      }).then(function () {
        if(userData.password) {
          return UserModel.hashPassword(userData.password).then(function (hash) {
            userData.password = hash;
          });
        }
      }).then(function () {
          return req.user.update(userData).then(function (user) {
          return UserMarshaller.marshal(user).then(function (user) {
            res.json(user);
          });
        });
      }).catch(function (err) {
          console.log(err);
        return res.status(500).send(err);
      });
    })
    .catch(function(e){
      console.log(e);
      return res.status(500).send(e);
    });
});

router.use('/:userId', function (req, res, next) {
    //do not correct != to !== , req.param.userId is a string
    if (req.currentUser.id != req.params.userId && req.currentUser.role_id !== adminRoleId) {
        console.log("User is not an admin");
        return res.status(401).end();
    }

    UserModel.findById(req.params.userId).then(function (user) {
        if (!user) {
            return res.status(404).end();
        }
        req.user = user;
        next();
    }).catch(function (err) {
      return res.status(500).send(err);
    });
}, userRouter);

module.exports = router;
