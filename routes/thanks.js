var router = require('express').Router();
var TYPES = require('tedious').TYPES;

/* GET task listing. */
router.get('/', function (req, res) {

    req.query("select * from thanks for json path")
        .into(res, '[]');

});

/* POST create task. */
router.post('/', function (req, res) {
    
    req.query("exec InsertThanks @thanks")
        .param('thanks', req.body, TYPES.NVarChar)
        .exec(res);

});

module.exports = router;
