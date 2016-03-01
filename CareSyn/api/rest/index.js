var router = require('express').Router();

router.use('/provider', require('./user'));
router.use('/user', require('./user/user.js'));
router.use('/measurement', require('./measurement'));
router.use('/monitor', require('./monitor'));


module.exports = router;
