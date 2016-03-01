'use strict';

var router = require('express').Router();
var _ = require('lodash');

var MonitorModel = require('models').Monitor;
var UserModel = require('models').User;
var MonintorMarshaller = require('../../../dto/monitor');
var UniqueCode = require('../../../components/unique');

var Errors = require('errors');
var logger = require('logger');

var SecurityCheck = function(req, res, next) {
  if(req.session.userId || req.session.monitorCode) {
    next();
  } else {
    throw new Errors.SecurityError("Access to monitor denied - not authenticated ");
  }
};

router.use(SecurityCheck);

//create new monitor
router.post('/', function(req, res){

    if(!req.body.userId) {
        req.body.userId = req.session.userId;
    }
    var monitor = MonitorModel.build(MonintorMarshaller.unmarshal(req.body));

    UniqueCode
    .generateUniqueCode()
    .then(function(code){
        monitor.patient_code = code;
        return monitor.save();
    }).then(function(monitorData){
      res.json(monitorData);
  }).catch(function(e){
      console.log(e);
      res.status(500).send(JSON.stringify(e));
    });

});

var monitorItem = require('express').Router({mergeParams: true});

monitorItem.use(function (req, res, next) {

    MonitorModel.find({
      where: {id: req.params.monitorId},
      include: [UserModel]
    }).then(function (monitor) {
        if (!monitor) {
            throw new Errors.HTTPNotFoundError("No monitor found for monitor id " + req.params.monitorId);
        }

        if(monitor.User.org_id != req.current_user.org_id && monitor.patient_code != req.session.monitorCode) {
            throw new Errors.SecurityError("User not authorized");
        }

        req.monitorModel = monitor;
        next();
    }).catch(function (err) {
      throw new Errors.SQLExceptionError(err);
    });
});

monitorItem.get('/', function(req, res){
    MonintorMarshaller.marshal(req.monitorModel).then(function(data){
        res.json(data);
    });
});

monitorItem.put('/', function(req, res){
    var monitorFromJSON = MonintorMarshaller.unmarshal(req.body);

    if(!req.session.userId) {
        monitorFromJSON = _.pick(monitorFromJSON, ['terms_accepted', 'auto_fetch']);
    }

    return MonitorModel.findById(req.params.monitorId).then(function (monitor) {
        return monitor.update(monitorFromJSON).then(function (updatedMonitor) {
            return MonintorMarshaller.marshal(updatedMonitor).then(function(monitorJSON){
                return res.json(monitorJSON);
            });
        });
    }).catch(function(e){
        logger.error(e);
        res.status(500).json(e);
    });
});

//unlink the monitor by clearing its oauth data from all measurements
monitorItem.delete('/unlink/:measurementId?', require('./unlink'));

monitorItem.delete('/', function(req, res){
    req.monitorModel
    .setMeasurements([])
    .then(function(){
      req.monitorModel
      .destroy()
      .then(function(){
        return res.json({success: true});
      });
    })
    .catch(function(e){
      logger.error(e);
      return res.status(500).json({success: false});
    });
});

router.use('/:monitorId', monitorItem);
router.use('/:monitorId/token', require('./token'));
router.use('/:monitorId/measurements', require('./measurements'));
router.use('/:monitorId/services', require('./services'));


module.exports = router;
