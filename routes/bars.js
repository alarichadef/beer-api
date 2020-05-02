const express = require('express');
const Bar = require('../models/bar');
const Beer = require('../models/beer');
var router = express.Router()


router.get('/', (req, res) => {
    Bar.find({ __deleted: { $exists: true } }).toArray().then(bars => {
        res.status(200).json(bars);
    })
});

router.get('/:id', (req, res) => {
    let id = req.params.id;
    if (!id) {
        return res.status(400).json({message: "Missing id parameter"});
    }
    Bar.get({id}).then(result => {
        if(!result) {
            return res.status(404).json({message: `Bar ${id} not found`});
        }
        let bar = result;
        let beersName = bar.beers.map(beer => {
            return beer.name;
        });
        Beer.filter({name: {$in: beersName}}).toArray().then(objects => {
            let beers = Beer.fromJSON(objects);
            beers.forEach(beer => {
                let beerIndex = bar.beers.findIndex(_beer => _beer.name === beer.name);
                if (beerIndex > -1) {
                    bar.beers[beerIndex] = {...bar.beers[beerIndex], ...beer}
                }
            });
            return res.status(200).json(bar);
        }).catch(e => {
            return res.status(400).json({message: `error while finding beer related to bar`});
        });
    }).catch((e) => {
        //Should never happen
        return res.status(400).json({message: `Several ${id} have been found`});
    });

});

module.exports = router;