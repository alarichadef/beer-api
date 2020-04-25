const express = require('express');
var router = express.Router()
const Beer = require('../models/beer');

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
            res.status(200).json(result);
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
            return res.status(200).json(result);
        }
        return res.status(404).json({message: `Beer ${name} not found`});
    }).catch(() => {
        return res.status(400).json({message: `Several ${name} have been found`});
    });

});

router.put('/:name', (req, res) => {
    let name = req.params.name;
    console.log(name);
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
        console.log(beer)
        try {
            beer.update( {picture, description, alcohol, type, brewery});
            beer.save().then(b => {
                return res.status(200).json(b);
            }).catch( e => {
                console.log(e);
                return res.status(500).json({e});
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({message: 'An error occured while updating'});
        }

    }).catch((e) => {
        console.log(e)
        //SHOULD NEVER HAPPENED
        return res.status(400).json({message: `Several ${name} have been found`});
    });

});



router.get('/', (req, res) => {
    Beer.find({ __deleted: { $exists: true } }).toArray().then(beers => {
        res.status(200).json(beers);
    })
});


module.exports = router;