const express = require('express');
var router = express.Router()
const Beer = require('../models/beer');

router.get('/list-names', (req, res) => {
    Beer.find().execute().then(beers => {
        res.status(200).json(Beer.toListNameApi(beers));
    });
});

router.get('/', (req, res) => {
    let skip =  parseInt(req.query.offset);
    let limit = parseInt(req.query.limit);
    if (!skip || isNaN(skip) || skip < 0) {
        skip = 0;
    }
    if (!limit || isNaN(limit) || limit > 20) {
        limit = 20;
    }
    Beer.find().skip(skip).limit(limit).execute().then(beers => {
        res.status(200).json(Beer.toListApi(beers));
    })
});

router.post('/', (req, res) => {
    let {name, picture, description, alcohol, type, brewery} = req.body;
    //TODO VALIDATE DATA
    if (!name || !alcohol) {
       return res.status(400).json({message: "Some mandatory fields are missing"});
    }
    Beer.get({name}).then(result => {
        if (result) {
            return res.status(400).json({message: "Object already exists"});
        }
        let beer = new Beer({name, picture, description, alcohol, type, brewery});
        beer.save().then(result => {
            res.status(200).json(result.toApi());
        }).catch(e => {
            res.status(400).json({message: 'an error occured, please try later'});
        });
    });

});


router.get('/:name', (req, res) => {
    let name = req.params.name;
    if (!name) {
        return res.status(400).json({message: "Missing name parameter"});
    }
    Beer.get({name}).then(result => {
        if (result) {
            return res.status(200).json(result.toApi());
        }
        return res.status(404).json({message: `Beer ${name} not found`});
    }).catch(() => {
        return res.status(400).json({message: `Several ${name} have been found`});
    });

});

router.put('/:name', (req, res) => {
    let name = req.params.name;
    let {picture, description, alcohol, type, brewery} = req.body;
    if (!name) {
        return res.status(400).json({message: "Missing name parameter"});
    }
    //TODO VALIDATE DATA
    if (!description) {
        return res.status(400).json({message: "Missing mandatory parameters"});
    }
    Beer.get({name}).then(beer => {
        if (!beer) {
            return res.status(404).json({message: `Beer ${name} not found`});
        }
        try {
            beer.update( {picture, description, alcohol, type, brewery} );
            beer.save().then(b => {
                return res.status(200).json(b);
            }).catch( e => {
                return res.status(500).json({e});
            });
        } catch (e) {
            return res.status(500).json({message: 'An error occured while updating'});
        }

    }).catch((e) => {
        //SHOULD NEVER HAPPENED
        return res.status(400).json({message: `Several ${name} have been found`});
    });

});

//for now, only handle hard delete
router.delete('/:name', (req, res) => {
    let name = req.params.name;
    if (!name) {
        return res.status(400).json({message: "Missing name parameter"});
    }
    Beer.get({name}).then(beer => {
        if (!beer) {
            return res.status(404).json({message: `Beer ${name} not found`});
        }
        beer.delete().then(b => {
            return res.status(200).json(b);
        }).catch( e => {
            return res.status(500).json({e});
        });

    }).catch((e) => {
        //SHOULD NEVER HAPPENED
        //TODO stop with shitty catch
        return res.status(400).json({message: `Several ${name} have been found`});
    });

});

module.exports = router;