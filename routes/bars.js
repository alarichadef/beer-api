const express = require('express');
const Bar = require('../models/bar');
var router = express.Router()


router.get('/', (req, res) => {
    Bar.find({ __deleted: { $exists: true } }).toArray().then(bars => {
        res.status(200).json(bars);
    })
}); 

module.exports = router;