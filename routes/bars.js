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
        return res.status(200).json(Responsability.toListApi(responsabilities));
    }).catch(e => {
        //sentry
    });
});

//List bar ask for responsabilities
//Admin and bar owners route
router.get('/list-bar-ask-responsables/:barId', auth, owner, (req, res) => {
    AskResponsability.filter({barId: req.params.barId}).execute().then(askResponsabilities => {
        return res.status(200).json(AskResponsability.toListApi(askResponsabilities));
    }).catch(e => {
        //sentry
    });
});

//List every bar owners
//Admin route
router.get('/list-bar-responsables', auth, admin, (req, res) => {
    Responsability.filter().execute().then(responsabilities => {
        return res.status(200).json(Responsability.toListApi(responsabilities));
    }).catch(e => {
        //sentry
    });
});

//List bar every ask for responsabilities
//Admin route
router.get('/list-bar-ask-responsables', auth, owner, (req, res) => {
    AskResponsability.filter().execute().then(askResponsabilities => {
        return res.status(200).json(AskResponsability.toListApi(askResponsabilities));
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

module.exports = router;