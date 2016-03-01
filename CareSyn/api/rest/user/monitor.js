var router = require("express").Router({mergeParams: true});
var MonitorModel = require("models").Monitor;
var MonitorDTO = require("../../../dto/monitor");
var Q = require("q");

router.get("/", function (req, res) {

    var where = {
        user_id: req.param("userId")
    };
    return MonitorModel.findAll({
      where: where
    }).then(function (results) {
        var marshal = [];
        for(var i = 0, l = results.length; i < l; i++) {
            var promise = MonitorDTO.marshal(results[i]);
            marshal.push(promise);
        }

        return Q.all(marshal)
        .then(function (marshalled) {
            res.json(marshalled);
        });
    }).catch(function (reason) {
      console.log("Monitor provider failed because: " +reason);
      res.status(500).end();
    });
});

module.exports = router;
