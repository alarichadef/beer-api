const express = require('express');
const app = express();
var multer  = require('multer');
var upload = multer();
var cors = require('cors')


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://alaric:bierebelge@cluster0-dstvq.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  app.locals.db = client.db('beers-back');
});

const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: "AKIA6BXNIGA7ZEJZJOER", // aws access id here
  secretAccessKey: "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", // aws secret access key here
  apiVersion: '2006-03-01',
  region: 'eu-west-3'
});
const params = {
  Bucket: "beer-storage",
  Expires: 60*60, // expiry time
  ACL: "bucket-owner-full-control",
  ContentType: "image/jpeg", // this can be changed as per the file type,
  success_action_redirect: '201',
  Fields : {

  }
};

app.use(cors())


app.get('/', function (req, res) {
  res.send('Hello World!');
});

const onMakeBeers = (res, result) => {
    res.status(200).json(result.ops);
}

//Clean the collection and create a new one from csv
const makeBeers = (beers, callback) => {
    const beersCollection = app.locals.db.collection('beers');
    console.log('beers => ', beersCollection);
    beersCollection.remove({},(err, result) => {
        if (err)
            console.log('err', err);
        console.log('in remove callback', result)
        beersCollection.insertMany(beers, (err, result) => {
            callback(result);
        });
    });
}

app.post('/upload-beers', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(500).send({ error: 'RIP' });
    }
    let fileCsv = req.file.buffer.toString('utf8');
    let toInserts = [];
    fileCsv.split('\n').map(line => {
        columns = line.split(';');
        if (columns.length === 6) {
            let line = {
                name: columns[0],
                picture: columns[1],
                brewery: columns[2],
                alcohol: columns[3],
                type: columns[4],
                description: columns[5].trim()
            }
            toInserts.push(line);
        }
    });
    makeBeers(toInserts, (result) => onMakeBeers(res, result));
});

app.get('/list-beers', (req, res) => {
    const beersCollection = app.locals.db.collection('beers');
    if (beersCollection) {
        beersCollection.find({}).toArray((err, beers) => {
            // so now, we can return all students to the screen.
            res.status(200).json(beers);
         });
    } else {
        res.status(500).send({error: 'RIP'});
    }
});
var port = process.env.PORT || 5000;

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
})


// api endpoint to get signed url
app.get("/get-signed-url", (req, res) => {
    params.Fields.Key = 'beer/' + create_UUID();
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


// api endpoint to get signed url
app.get("/get-object", (req, res) => {
    //854cdf00-73be-4857-9ea8-6c15cd89ef13
    const params = {
        Bucket: "beer-storage",
        Expires: 60*60, // expiry time
        Key: 'beer/854cdf00-73be-4857-9ea8-6c15cd89ef13'
      };
    s3.getSignedUrl('getObject' ,params, (err, data) => {
        if (err) {
            console.log("Error getting presigned url from AWS S3", err);
            res.status(500).json({
              message: "Pre-Signed URL error",
            });
        }
        res.status(200).json(data);
    });
});


function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
