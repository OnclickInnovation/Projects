var router = require('express').Router();
var UserModel = require('models').User;
var RoleModel = require('models').Role;
var Errors = require('errors');

var patientListSecurity = function (req, res, next) {
  if(!req.session.userId) {
    res.status(401).end();
    return;
  }
  UserModel.find({where: {id: req.session.userId}, include: [RoleModel]}).then(function (user) {
    if(req.params.userId != req.session.userId) {
      return res.status(401).end();
    }
    next();
  }).catch(function () {
    res.status(500).end();
  });
};

router.use('/:userId/monitor', patientListSecurity, require('./monitor'));
module.exports = router;
