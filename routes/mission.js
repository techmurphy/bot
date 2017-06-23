var router = require('express').Router();
var TYPES = require('tedious').TYPES;
console.log('Inside the mission js file');


router.get('/',function (req, res) {
    req.query("select * from mission for json path")
        .into(res, '[]');
});

router.post('/',function (req, res) {
    console.log('about to execute the insert'+req.body);
    req.query("exec insertmission @mission")
        .param('mission', req.body, TYPES.NVarChar)
        .exec(res);
    console.log("trace1");
});



module.exports = router;
