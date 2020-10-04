const express = require('express');
const Bar = require('../models/bar');
const Beer = require('../models/beer');
const Favourite = require('../models/favourite');
const Responsability = require('../models/responsability');
const AskResponsability = require('../models/askResponsability');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const owner = require('../middleware/owner');
const Sentry = require('@sentry/node');

var router = express.Router()

router.get('/', (req, res) => {
    let filters = {};
    if (req.query.beer) {
        filters['beers.name'] = req.query.beer;
    }
    if (req.query.type) {
        filters['beers.type'] = req.query.type
    }
    if (req.query.tag) {
        filters['tags'] = req.query.tag
    }
    if (req.query.happyhour) {
        let weekday = new Date().toLocaleString("en", { weekday: "long" }).toLowerCase();
        filters[`happyHourTime.${weekday}.start`] = {$lte: parseInt(req.query.happyhour)};
        filters[`happyHourTime.${weekday}.end`] = {$gte: parseInt(req.query.happyhour)};
    }
    if (req.query.price) {
        filters['beers.pricing.priceHappy'] = {$lt: parseInt(req.query.price)};
    }
    Bar.find(filters).execute().then(bars => {
        res.status(200).json(Bar.toListApi(bars));
    });
});

//List bar owners
//Admin and bar owners route
router.get('/list-bar-responsables/:barId', auth, owner, (req, res) => {
    Responsability.filter({barId: req.params.barId}).execute().then(responsabilities => {
        Responsability.toListApi(responsabilities).then(resps => {
            return res.status(200).json(resps);
        });
    }).catch(e => {
        //sentry
    });
});

//List bar ask for responsabilities
//Admin and bar owners route
router.get('/list-bar-ask-responsables/:barId', auth, owner, (req, res) => {
    AskResponsability.filter({barId: req.params.barId}).execute().then(askResponsabilities => {
        AskResponsability.toListApi(askResponsabilities).then(resps => {
            return res.status(200).json(resps);
        });
    }).catch(e => {
        //sentry
    });
});

//List every bar owners
//Admin route
router.get('/list-bar-responsables', auth, admin, (req, res) => {
    Responsability.filter().execute().then(responsabilities => {
        Responsability.toListApi(responsabilities).then(resps => {
            return res.status(200).json(resps);
        });
    }).catch(e => {
        //sentry
    });
});

//List bar every ask for responsabilities
//Admin route
router.get('/list-bar-ask-responsables', auth, owner, (req, res) => {
    AskResponsability.filter().execute().then(askResponsabilities => {
        AskResponsability.toListApi(askResponsabilities).then(resps => {
            return res.status(200).json(resps);
        });
    }).catch(e => {
        //sentry
    });
});

router.get('/:id', (req, res) => {
    let id = req.params.id;
    if (!id) {
        return res.status(400).json({message: "Missing id parameter"});
    }
    Bar.get({id}).then(bar => {
        if(!bar) {
            return res.status(404).json({message: `Bar ${id} not found`});
        }
        let beersName = bar.beers.map(beer => {
            return beer.name;
        });
        Beer.filter({name: {$in: beersName}}).execute().then(beers => {
            beers.forEach(beer => {
                let beerIndex = bar.beers.findIndex(_beer => _beer.name === beer.name);
                if (beerIndex > -1) {
                    bar.beers[beerIndex] = {...bar.beers[beerIndex], ...beer.toApi()}
                }
            });
            Favourite.filter({barId: id}).count().then(count => {
                bar.favouritesCount = count;
                return res.status(200).json(bar.toApi());
            });
        }).catch(e => {
            Sentry.captureException(e);
            return res.status(400).json({message: `error while finding beer related to bar`});
        });
    }).catch((e) => {
        Sentry.captureException(e);
        return res.status(400).json({message: `Several ${id} have been found`});
    });

});


function validate_bars({name, address, location, type, happyHourTime, openingTime, beers, tags, characteristics}, next) {
    //Mandatory fields
    if (!name || !address, !location || !type || !happyHourTime || !openingTime || !beers) {
        return next({status: 400, content: {message: "Some mandatory fields are missing", keyError: 'missingFields'}});
    }
    if (isNaN(location.latitude) || isNaN(location.longitude)) {
        return next({status: 400, content: {message: "Location must be an object with longitude and latitude", keyError: 'invalidLocation'}});
    }
    if (!Array.isArray(beers)) {
        return next({status: 400, content: {message: "You must provide an array of beers", keyError: 'notArrayOfBeers'}});
    }
    if (typeof characteristics !== 'object') {
        return next({status: 400, content: {message: "Characteristics must be an object", keyError: 'invalidCharacteristics'}});
    }
    if (!Array.isArray(tags)) {
        return next({status: 400, content: {message: "Tags must be an array", keyError: 'invalidTags'}});
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (typeof openingTime !== 'object') {
        return next({status: 400, content: {message: "opening time must be an object", keyError: 'invalidOpeningTime'}});
    }
    for(const [day, value] of Object.entries(openingTime)) {
        if (!days.includes(day)) {
            return next({status: 400, content: {message: "Invalid day in opening object", keyError: 'invalidDay'}});
        }
        if (typeof value !== 'object') {
            return next({status: 400, content: {message: "opening time value must be an object", keyError: 'invalidDayValue'}});
        }
        if (!value.opening || !value.closing) {
            return next({status: 400, content: {message: "opening and closing are mandatory", keyError: 'missingOpeningClosing'}});
        }
    }

    if (typeof happyHourTime !== 'object') {
        return next({status: 400, content: {message: "happyhour time must be an object", keyError: 'invalidHappyHourTime'}});
    }
    for(const [day, value] of Object.entries(happyHourTime)) {
        if (!days.includes(day)) {
            return next({status: 400, content: {message: "Invalid day in opening object", keyError: 'invalidDay'}});
        }
        if (typeof value !== 'object') {
            return next({status: 400, content: {message: "opening time value must be an object", keyError: 'invalidDayValue'}});
        }
        if (!value.start || !value.end) {
            return next({status: 400, content: {message: "opening and closing are mandatory", keyError: 'missingOpeningClosing'}});
        }
    }

    for (const i = 0 ; i < beers.length; i++) {
        const {name, pricing} = beers[i];
        if (!name  || !pricing || !Array.isArray(pricing)) {
            return next({status: 400, content: {message: "Name or Pricing are missing", keyError: 'missingFieldsBeers'}});
        }
        for (const j = 0; j < pricing.length; j ++) {
            const {priceBeer, priceHappy, typeContainer, volume} = pricing[i];
            if (!priceBeer || !typeContainer || !volume) {
                return next({status: 400, content: {message: "Invalid pricing", keyError: 'invalidPricing'}});
            }
        }
    }
    let beersName = beers.map(beer => {
        return beer.name;
    });
    return Beer.filter({name: {$in: beersName}}).execute();
}

router.post('/', auth, admin, (req, res, next) => {
    //Check bar data
    validate_bars(req.data).then(beers => {
        if(beers.length !== data.beers.length) {
            return next({status: 400, content: {message: "Some beers do not exist", keyError: 'beersNotFound'}});
        }
        const {name, address, location, type, happyHourTime, openingTime, beers: _beers, tags, characteristics, keywords} = data;
        Bar.get({name, location}).then(result => {
            if (result) {
                return next({status: 400, content: {message: "Bar already existing", keyError: 'alreadyExisting'}});
            }
            let bar = new Bar({name, address, location, type, happyHourTime, openingTime, _beers, tags, characteristics, keywords});
            bar.save().then(result => {
                res.status(200).json(result.toApi());
            }).catch(e => {
                Sentry.captureException(e);
                return next({status: 500, content: {message: "Can not saved this bar", keyError: 'internalError'}});
            });
        })
    });
});

router.put('/:barId', auth, admin, (req, res, next) => {
    //Check bar data
    let barId = req.params.barId;
    if (!barId) {
        return next({status: 400, content: {message: "barId is mandatory", keyError: 'missingBarId'}});
    }
    validate_bars(req.data, next).then(beers => {
        if(beers.length !== data.beers.length) {
            return next({status: 400, content: {message: "Some beers do not exist", keyError: 'beersNotFound'}});
        }
        const {name, address, location, type, happyHourTime, openingTime, beers: _beers, tags, characteristics, keywords} = data;
        Bar.get({id: barId}).then(bar => {
            if (!bar) {
                return next({status: 400, content: {message: "Bar does not exist", keyError: 'notExisting'}});
            }
            bar.update({name, address, location, type, happyHourTime, openingTime, beers: _beers, tags, characteristics, keywords});
            bar.save().then(result => {
                res.status(200).json(result.toApi());
            }).catch(e => {
                Sentry.captureException(e);
                return next({status: 500, content: {message: "Can not saved this bar", keyError: 'internalError'}});
            });
        })
    });
});


module.exports = router;