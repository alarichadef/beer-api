const express = require('express');
var multer  = require('multer')
var router = express.Router()
const s3 = require('../tools/aws');
const Beer = require('../models/beer');
const Bar = require('../models/bar');
const Utils = require('../tools/utils');
var upload = multer();

const params = {
    Bucket: "beer-storage",
    Expires: 60*60, // expiry time
    ACL: "bucket-owner-full-control",
    ContentType: "image/jpeg", // this can be changed as per the file type,
    success_action_redirect: '201',
    Fields : {
    }
  };

router.post('/upload-beers', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(500).send({ error: 'RIP' });
    }
    let fileCsv = req.file.buffer.toString('utf8');
    let toInserts = [];
    fileCsv.split('\n').map(line => {
        columns = line.split(';');
        if (columns.length === 6) {
            let line = {
                name: columns[0].trim(),
                picture: columns[1],
                brewery: columns[2],
                alcohol: columns[3],
                type: columns[4],
                description: columns[5].trim()
            }
            toInserts.push(new Beer(line));
        }
    });
    makeBeers(toInserts, (result) => onMakeBeers(res, result));
});

const onMakeBeers = (res, result) => {
    res.status(200).json(result.ops);
}

//Clean the collection and create a new one from csv
const makeBeers = (beers, callback) => {
    Beer.drop().then((result) => {
        Beer.insertMany(beers).then(res => {
            callback(res);
        })
    });
}

router.post('/upload-bars', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(500).send({ error: 'RIP' });
    }
    let fileCsv = req.file.buffer.toString('utf8');
    let toInserts = [];
    fileCsv.split('\n').map(line => {
        columns = line.split(' BaptisteEstUnBG ');
        if (columns.length && columns.length > 1) {
            let line = {
                name: columns[0].trim(),
                coordinates: columns[6],
            }
            toInserts.push(new Bar(line));
        }
    });
    makeBars(toInserts, (result) => onMakeBars(res, result));
});

const onMakeBars = (res, result) => {
    res.status(200).json(result.ops);
}

//Clean the collection and create a new one from csv
const makeBars = (bars, callback) => {
    Bar.drop().then((result) => {
        Bar.insertMany(bars).then(res => {
            callback(res);
        })
    });
}

// api endpoint to get signed url
router.get("/get-signed-url", (req, res) => {
    params.Fields.Key = 'beer/' + Utils.create_UUID();
    s3.createPresignedPost(params, (err, data) => {
        if (err) {
            console.log("Error getting presigned url from AWS S3");
            res.status(500).json({
              message: "Pre-Signed URL error",
            });
        }
        res.status(200).json(data);
    });
});


module.exports = router;