var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
/* GET home page. */
router.get('/', function(req, res, next) {
	var cipher =  new Buffer(config.facebook.id).toString('base64');
	res.send(cipher);
 });

module.exports = router;
