var router = require('express').Router();
var TYPES = require('tedious').TYPES;

/* GET mission listing. */
router.get('/', function (req, res) {

    req.query("select * from mission for json path")
        .into(res, '[]');

});

/* POST insert mission */
router.post('/', function (req, res) {
    
    req.query("exec insertmissions @mission")
        .param('mission', req.body, TYPES.NVarChar)
        .exec(res);

});

module.exports = router;
