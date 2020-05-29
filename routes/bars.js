const express = require('express');
const Bar = require('../models/bar');
const Beer = require('../models/beer');
const Responsability = require('../models/responsability');
const AskResponsability = require('../models/askResponsability');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const owner = require('../middleware/owner');

var router = express.Router()


router.get('/', (req, res) => {
    const skip =  0;
    const limit = 0;
    Bar.find({ __deleted: { $exists: true } }).skip(skip).limit(limit).execute().then(bars => {
        res.status(200).json(Bar.toListApi(bars));
    })
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
            return res.status(200).json(bar.toApi());
        }).catch(e => {
            return res.status(400).json({message: `error while finding beer related to bar`});
        });
    }).catch((e) => {
        //Should never happen
        return res.status(400).json({message: `Several ${id} have been found`});
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


module.exports = router;