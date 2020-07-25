//Midleware allowing to check the token/valid user
const Token = require('../tools/token');
const User = require('../models/user');
const Utils = require('../tools/utils');
const Sentry = require('@sentry/node');

module.exports = (req, res, next) => {
    let token = req.get('authorization');
    if (!token) {
        return res.status(400).json({message: 'missing token', keyError: 'missingToken'});
    }
    token = Utils.isValidBearer(token);
    if (!token) {
        return res.status(400).json({message: 'invalid bearer format', keyError: 'invalidBearer'});
    }
    let token_verified = Token.verify(token);
    if (token_verified.error) {
        return res.status(400).json({message: 'Error while verifying token', error: token_verified.error, keyError: 'InvalidToken'});
    }
    User.get({id: token_verified.token.payload.sub}).then(user => {
        req.user = user;
        return next();
    }).catch(e => {
        Sentry.captureException(e);
        return res.status(500).json({message: 'a weird error occured here', keyError: 'death'});
    });
}