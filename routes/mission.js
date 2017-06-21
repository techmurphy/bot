var router = require('express').Router();
var TYPES = require('tedious').TYPES;
console.log('Inside the mission js file');

router.route('/mission')
.post(function (req, res) {
    console.log('about to execute the insert');
    req.query("exec insertmission @mission")
        .param('mission', req.body, TYPES.NVarChar)
        .exec(res);
})
.get(function (req, res) {
    req.query("select * from mission for json path")
        .into(res, '[]');
});


module.exports = router;
