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
                location: columns[6],
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


router.post('/upload-mister', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(500).send({ error: 'RIP' });
    }
    let fileJson = req.file.buffer.toString('utf8');
    fileJson = JSON.parse(fileJson);
    f = fileJson.find(f => f.beers.length);

    let idBars = [];
    let idBeers = [];
    let beersToCreate  = [];
    let barsToCreate = [];

    for (let i = 0; i < fileJson.length; i++) {
        let bar = fileJson[i];
         //Check if the bars has not been computed yet
        let id = bar.objectId;
        if (idBars.includes(id)) {
            continue;
        }
        //handle beers inside bar
        beers = bar.beers;
        let beersBar = [];
        beers.forEach(beer => {
            //Check if the beer exist in the DB
            if (!idBeers.includes(beer.objectId)) {
                //Create an object beer
                let description = {};
                for (let key of ['Eye', 'Mouth', 'Nose']) {
                    if (beer[key]) {
                        description[key] = beer[key]
                    }
                }
                let newBeer = {
                    name: beer.name,
                    picture: beer.ratebeerData?.img_url,
                    brewery: beer.ratebeerData?.brewery,
                    alcohol: beer.alcoholLevel ? beer.alcoholLevel : beer.ratebeerData?.abv,
                    type: beer.color,
                    ibu: beer.ratebeerData?.ibu,
                    rateBeer: beer.ratebeerData,
                    rateBeerUrl: beer.ratebeerUrl,
                    descriptionObject: description,
                    description: beer.style
                }

                let beerObject = new Beer(newBeer);
                idBeers.push(beer.objectId);
                beersToCreate.push(beerObject);
            }
            let priceBeer = beer.regularPrice;
            let priceHappy = beer.happyHourPrice;
            //Draft or bottlled ?
            let type = beer.type;
            let volume = beer.volume;
            let beerBar = {
                name: beer.name,
                priceBeer,
                priceHappy,
                type,
                volume
            };
            beersBar.push(beerBar);
        });

        //So we have got the beers belonging to the bars
        //Let's gather the others informations

        //Informations about privateaser ?
        let privateaserBookingUrl = bar.privateaser_booking_url;
        let privateaserId = bar.privateaser_id;

        //fake date for if we don't have the informations
        let d = new Date;
        d = d.toISOString();

        //Informations about opening times
        let openingTime = {
            monday: {
                opening: d,
                closing: d
            },
            tuesday: {
                opening: d,
                closing: d
            },
            wednesday: {
                opening: d,
                closing: d
            },
            thursday: {
                opening: d,
                closing: d
            },
            friday: {
                opening: d,
                closing: d
            },
            saturday: {
                opening: d,
                closing: d
            },
            sunday: {
                opening: d,
                closing: d
            }
        };
        let startHappy = bar?.startHappyHour?.iso || d;
        let endHappy = bar?.endHappyHour?.iso || d;

        let happyHourTime = {
            monday: {
                start: startHappy,
                end: endHappy
            },
            tuesday: {
                start: startHappy,
                end: endHappy
            },
            wednesday: {
                start: startHappy,
                end: endHappy
            },
            thursday: {
                start: startHappy,
                end: endHappy
            },
            friday: {
                start: startHappy,
                end: endHappy
            },
            saturday: {
                start: startHappy,
                end: endHappy
            },
            sunday: {
                start: startHappy,
                end: endHappy
            }
        };

        let address = bar.address;
        let type = bar.className;
        let tags = bar.tags;
        let characteristics = bar.characteristics;
        let name = bar.name;
        let keywords = bar.keywords;
        let minPrice = bar.regularPrice;
        let minPriceHappy = bar.happyHourPrice;
        let location = {
            latitude: bar?.location?.latitude,
            longitude: bar?.location?.longitude
        }
        let newBar = {
            name,
            address,
            location,
            type,
            tags,
            characteristics,
            happyHourTime,
            openingTime,
            privateaserBookingUrl,
            privateaserId,
            beers: beersBar,
            keywords,
            minPrice,
            minPriceHappy
        }
        let barObject = new Bar(newBar);
        idBars.push(id);
        barsToCreate.push(barObject);
    };

    //So once we are here, we got every bars, beers
    //What are we doing to do next ?
    //Create them for god's sake !
    makeBeers(beersToCreate, () => makeBars(barsToCreate, (result) => onMakeBars(res, result)));
});


module.exports = router;