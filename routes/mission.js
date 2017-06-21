var router = require('express').Router();
var TYPES = require('tedious').TYPES;
console.log('Inside the mission js file');
/* GET mission listing. */
router.get('/', function (req, res) {
    req.query("select * from mission for json path")
        .into(res, '[]');
});
console.log('before the post part');
/* POST insert mission */
router.post('/', function (req, res) { 
    req.query("exec insertmission @mission")
        .param('mission', req.body, TYPES.NVarChar)
        .exec(res);
});

module.exports = router;
