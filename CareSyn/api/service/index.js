'use strict';

var router = require('express').Router();
var _ = require('lodash');

var servicelist = require('../../components/servicemap/servicelist');

//list all the services we provide
router.get('/', function (req, res) {
  return res.json(servicelist.getServices());
});

//oauth v1 services provided will be handled here
router.use("/v1", require('./oauthv1'));

//oauth v2 services provided will be handled here
router.use("/v2", require('./oauthv2'));


module.exports = router;
