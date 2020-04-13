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
