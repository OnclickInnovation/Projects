var UserModel = require('models').User;
var RoleModel = require('models').Role;
var Errors = require('errors');

var router = require('express').Router();

router.post('/', function (req, res) {

  var role;

  return UserModel.hashPassword(req.body.password).then(function (pwdHash) {

    return UserModel.find({
      where: {
        email: req.body.email
      }
    }).then(function (existing) {
      if(existing) {
        res.status(422).send("User with same email already exists");
      }
    }).then(function () {
      return RoleModel.find({
        where: {
          name: 'Admin'
        }
      }).then(function (adminRole) {
        role = adminRole;
      });
    }).then(function () {
      return UserModel.create({
        first_name: req.body.first_name,
        middle_name: req.body.middle_name,
        last_name: req.body.last_name,
        email: req.body.email,
        phone_work: req.body.phone_work,
        phone_mobile: req.body.phone_mobile,
        password: pwdHash,
        registration_date: new Date(),
        role_id: role.id
      });
    }).then(function (user) {
      res.status(204).send();
    });
  });
});

module.exports = router;
