//Midleware allowing to check if the user is admin of one of the owner of the bar
//Check for the bar owner in get params and body to handle post and get requests with same middleware
const Token = require('../tools/token');
const Responsability = require('../models/responsability');
const Utils = require('../tools/utils');

module.exports = (req, res, next) => {
    let user = req.user;
    // if the user is admin, he's got access to every page
    if (user.isAdmin) {
        return next();
    }
    let { barId } = req.body;
    if (!barId) {
        barId = req.params.barId
    }
    if (!barId) {
        return res.status(400).json({message: 'Missing bar Id', keyError: 'missingFields'});
    }
    //Otherwise we have to check if he's one of the bar owner
    Responsability.get({userId: user.id, barId}).then(responsability => {
        if (!responsability) {
            return res.status(403).json({message: 'You are not one of the owner', keyError: 'notOwner'});
        }
        return next();
    }).catch(e => {
        //Add sentry here
        return res.status(500).json({message: 'a weird error occured here', keyError: 'death'});
    });
}