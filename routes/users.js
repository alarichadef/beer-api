const express = require('express');
var router = express.Router()
const User = require('../models/user');
const Bar = require('../models/bar');
const Sentry = require('@sentry/node');
const Responsability = require('../models/responsability');
const AskResponsability = require('../models/askResponsability');
const Favourite = require('../models/favourite');
const Utils = require('../tools/utils');
const Token = require('../tools/token');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const owner = require('../middleware/owner');
const checkCurrentuser = require('../middleware/checkCurrentUser');

router.post('/signup', (req, res, next) => {
    let { username, email, password, passwordConfirmed } = req.body;
    //validate fields
    if(!username || !email || !password || !passwordConfirmed) {
        return res.status(400).json({message: 'Some fields are missing', keyError: 'missingFields'});
    }
    let errorsPassword = Utils.validatePassword(password);
    if (errorsPassword.length) {
        return res.status(400).json({message: errorsPassword, keyError: 'passwordErrors'});
    }
    if (password !== passwordConfirmed) {
        return res.status(400).json({message: `Passwords don't match`, keyError: 'matchError'});
    }
    if (!Utils.validateEmail(email)) {
        return res.status(400).json({message: "Invalid email", keyError: 'invalidEmail'});
    }

    //Check if the user already exists
    User.find({$or: [{email}, {username}] }).execute().then(result => {
        if (result?.length) {
            return res.status(400).json({message: "User already exists", keyError: 'alreadyUsed'});
        }
        //Create the user
        //Hash the password
        let hashPass = Utils.hash(password);
        let user = new User({username, email, password: hashPass});
        user.save().then(user => {
            if (!user) {
                return next({status: 500, content: {message: 'Error while creating the user', keyError: 'UserCreation'}});
            }
            //Create a token and send it back
            let token = Token.create_token(user);
            Sentry.configureScope(scope => {
                scope.setExtra('username', user.username);
                scope.setExtra('email', user.email);
            });
            Utils.sendRegistrationMail(user).then(() => {
                console.log('mail has been sent');
            }).catch(e => {
                Sentry.captureException(e);
            })
            return res.status(201).json({token});
        }).catch(e => {
            Sentry.captureException(e);
        });
    });
});

router.post('/signin', (req, res) => {
    let { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Email or password missing', keyError: 'missingFields'});
    }
    if (!Utils.validateEmail(email)) {
        return res.status(400).json({message: "Invalid email", keyError: 'invalidEmail'});
    }
    let hashPass = Utils.hash(password);
    User.get({email, password: hashPass}).then(user => {
        if(!user) {
            return res.status(400).json({message: 'No user has been found', keyError: 'userNotFound'});
        }
        Sentry.configureScope(scope => {
            scope.setExtra('username', user.username);
            scope.setExtra('email', user.email);
        });
        //Get his bars
        let barsId;
        Responsability.find({userId: user.id}).execute().then(responsabilities => {
            barsId = Responsability.toListApiId(responsabilities);
            //Get his favourites
            return Favourite.find({userId: user.id}).execute();
        }).then(favourites => {
            let favouritesId = Favourite.toListApiId(favourites);
            //Create a token and send it back
            let token = Token.create_token(user, barsId, favouritesId);
            return res.status(200).json({token});
        }).catch(e => {
            Sentry.captureException(e);
        });
    });
});

//Allowing to ajax check validity of an username while user is typing it
router.get('/check-username', (req, res) => {
    let { username } = req.query;
    if (!username) {
        return res.status(400).json({message: "Missing username", keyError: 'missingFields'});
    }
    User.get({username}).then(user => {
        if (user) {
            return res.status(400).json({message: "Username already taken", keyError: 'userFound'});
        }
        res.status(200).json({message: "Username available", keyError: null});
    });
});

//Simple route allowing an admin to make a user admin or not
router.patch('/update-admin', auth, admin, (req, res) => {
    let { email, admin } = req.body;
    if (!email || !admin) {
        return res.status(400).json({message: "Missing email or admin parameter", keyError: 'missingFields'});
    }
    if (![true, false].includes(admin)) {
        return res.status(400).json({message: "admin value must be a boolean", keyError: 'invalidFields'});
    }
    User.get({email}).then(user => {
        if (!user) {
            return res.status(400).json({message: "User not found", keyError: 'userNotFound'});
        }
        user.update({isAdmin: admin}).save().then(u => {
            return res.status(200).json(u.toApi());
        }).catch( e => {
            return res.status(500).json({e});
        });;
    }).catch(e => {
        //sentry
    });
});

//Admin features to list every users
router.get('/', auth, admin, (req, res) => {
    User.find({ __deleted: { $exists: true } }).execute().then(users => {
        res.status(200).json(User.toListApi(users));
    });
});

//Allowing to add a bar responsability to a user
//Admin route
router.post('/bar-responsability', auth, admin, (req, res) => {
 let {userId, barId} = req.body;
    if (!userId || !barId) {
        return res.status(400).json({message: "Missing userId or barId parameter", keyError: 'missingFields'});
    }
    User.get({id: userId}).then(user => {
        if (!user) {
            return res.status(400).json({message: "User not found", keyError: 'userNotFound'});
        }
        Bar.get({id: barId}).then(bar => {
            if (!bar) {
                return res.status(400).json({message: "Bar not found", keyError: 'barNotFound'});
            }
            Responsability.get({userId, barId}).then(responsability => {
                if (responsability) {
                    return res.status(400).json({message: "User already responsible", keyError: 'alreadyOwner'});
                }
                let newResponsability = new Responsability({userId, barId});
                newResponsability.save().then(newResp => {
                    return res.status(201).json(newResp.toApi());
                }).catch(e => {
                    return res.status(500).json(e);
                    //sentry
                });
            });
        });
    });
});

//Allowing to remove a bar responsability from a user
//Admin route
router.delete('/bar-responsability', auth, admin, (req, res) => {
    let {userId, barId} = req.body;
    if (!userId || !barId) {
        return res.status(400).json({message: "Missing userId or barId parameter", keyError: 'missingFields'});
    }
    User.get({id: userId}).then(user => {
        if (!user) {
            return res.status(400).json({message: "User not found", keyError: 'userNotFound'});
        }
        Bar.get({id: barId}).then(bar => {
            if (!bar) {
                return res.status(400).json({message: "Bar not found", keyError: 'barNotFound'});
            }
            Responsability.get({userId, barId}).then(responsability => {
                if (!responsability) {
                    return res.status(400).json({message: "User not responsible", keyError: 'notOwner'});
                }
                responsability.delete().then(r => {
                    return res.status(201).json(r);
                }).catch(e => {
                    return res.status(500).json(e);
                    //sentry
                });
            });
        });
    });
});

//Save in db a ask for bar responsability
//simple user authentify route
router.post('/ask-for-bar-responsability', auth, (req, res) => {
    let { barId, reason=null, pictures=[], studied=false, accepted=null } = req.body;
    if (!barId) {
        return res.status(400).json({message: "Missing barId parameter", keyError: 'missingFields'});
    }
    let userId = req.user.id;
    //Check if already owner
    Responsability.get({userId, barId}).then(responsability => {
        if (responsability) {
            return res.status(400).json({message: "User already responsable", keyError: 'alreadyOwner'});
        }
        //Check if a demand has already been filled
        AskResponsability.get({userId, barId}).then(askResponsability => {
            if (askResponsability) {
                return res.status(400).json({message: "User already ask for responsability", keyError: 'alreadyAskResponsability'});
            }
            let newAskResponsability = new AskResponsability({barId, userId, reason, pictures, studied, accepted});
            newAskResponsability.save().then(newAsk => {
                return res.status(201).json(newAsk.toApi());
            }).catch(e => {
                //sentry
                return res.status(500).json(e);
            });
        });
    })
});

//accept a ask for bar responsability
//only for admin and bar owner
router.post('/handle-bar-responsability', auth, owner, (req, res) => {
    let { userId, barId, stateRequest } = req.body;
    if (!userId || !barId || !stateRequest) {
        return res.status(400).json({message: "Missing userId or barId parameter or state request", keyError: 'missingFields'});
    }
    if (![true, false].includes(stateRequest)) {
        return res.status(400).json({message: "stateRequest value must be a boolean", keyError: 'invalidFields'});
    }
    //Check if a demand has already been filled
    AskResponsability.get({userId, barId}).then(askResponsability => {
        if (!askResponsability) {
            return res.status(400).json({message: "No ask for responsability filled", keyError: 'noAskResponsability'});
        }
        if (askResponsability.studied === true) {
            return res.status(400).json({message: "Already studied", keyError: 'alreadyStudied'});
        }
        askResponsability.update({studied: true, accepted: stateRequest});
        askResponsability.save().then(ask => {
            if (stateRequest === false) {
                return res.status(200).json({message: 'declined', ...ask.toApi()});
            }
            //So create the responsability related
            let newResponsability = new Responsability({userId, barId});
            newResponsability.save().then(newResp => {
                return res.status(201).json({message: 'accepted', ...newResp.toApi()});
            }).catch(e => {
                return res.status(500).json(e);
                //sentry
            });
        }).catch(e => {
            //sentry
            return res.status(500).json(e);
        });
    });
});

//Allowing to list ask responsability
//Current user route or admin
//TODO add filters in parameters to handle accepted, denied etc...
router.get('/list-user-ask-responsabilities/:userId', auth, checkCurrentuser, (req, res) => {
    AskResponsability.filter({userId: req.params.userId}).execute().then(askResponsabilities => {
        return res.status(200).json(AskResponsability.toListApi(askResponsabilities));
    }).catch(e => {
        //sentry
    });
});

//Allowing to list responsability
//Current user route or admin
//TODO add filters in parameters to handle accepted, denied etc...
router.get('/list-user-responsabilities/:userId', auth, checkCurrentuser, (req, res) => {
    Responsability.filter({userId: req.params.userId}).execute().then(responsabilities => {
        //TODO Refresh token with this new responsabilities ?
        return res.status(200).json(Responsability.toListApi(responsabilities));
    }).catch(e => {
        //sentry
    });
});

//Admin route listing every user responsabilities
router.get('/list-user-responsabilities', auth, admin, (req, res) => {
    Responsability.filter().execute().then(responsabilities => {
        //TODO Refresh token with this new responsabilities ?
        return res.status(200).json(Responsability.toListApi(responsabilities));
    }).catch(e => {
        //sentry
    });
});

//Admin route listing every user ask for responsabilities
router.get('/list-user-ask-responsabilities', auth, admin, (req, res) => {
    AskResponsability.filter().execute().then(responsabilities => {
        //TODO Refresh token with this new responsabilities ?
        return res.status(200).json(AskResponsability.toListApi(responsabilities));
    }).catch(e => {
        //sentry
    });
});

//Route allowing to add a bar as favourite
router.post('/favourites', auth, checkCurrentuser, (req, res, next) => {
    let {barId} = req.body;
    if (!barId) {
        return next({status: 400, content: {message: "Missing barId parameter", keyError: 'missingFields'}});
    }
    let userId = req.user.id;
    Bar.get({id: barId}).then(bar => {
        if (!bar) {
            return next({status: 400, content: {message: "Bar not found", keyError: 'barNotFound'}});
        }
        Favourite.get({userId, barId}).then(favourite => {
            if (favourite) {
                return next({status: 400, content: {message: "User has already saved this bar", keyError: 'alreadySaved'}});
            }
            let newFavourite = new Favourite({userId, barId});
            newFavourite.save().then(newFav => {
                return res.status(201).json(newFav.toApi());
            }).catch(e => {
                Sentry.captureException(e);
                return res.status(500).json(e);
            });
        });
    });
});


//Route allowing to add a bar as favourite
router.delete('/favourites/:barId', auth, checkCurrentuser, (req, res, next) => {
    let { barId } = req.params;
    if (!barId) {
        return next({status: 400, content: {message: "Missing barId parameter", keyError: 'missingFields'}});
    }
    let userId = req.user.id;
    Bar.get({id: barId}).then(bar => {
        if (!bar) {
            return next({status: 400, content: {message: "Bar not found", keyError: 'barNotFound'}});
        }
        Favourite.get({userId, barId}).then(favourite => {
            if (!favourite) {
                return next({status: 400, content: {message: "User has not saved this bar", keyError: 'notSaved'}});
            }
            favourite.delete().then(r => {
                return res.status(201).json(r);
            }).catch(e => {
                Sentry.captureException(e);
                return res.status(500).json(e);
            });
        });
    });
});


//Allowing to list favourites from user
//Current user route or admin
router.get('/favourites/:userId', auth, checkCurrentuser, (req, res) => {
    Favourite.filter({userId: req.params.userId}).execute().then(favourites => {
        //TODO Refresh token with this new favourites ?
        return res.status(200).json(Favourite.toListApi(favourites));
    }).catch(e => {
        //sentry
    });
});

//Admin route allowing to delete an user with its email
router.delete('/:email', auth, admin, (req, res) => {
    let email = req.params.email;
    if (!email) {
        return res.status(400).json({message: "Missing email parameter", keyError: 'missingFields'});
    }
    User.get({email}).then(user => {
        if (!user) {
            return res.status(404).json({message: `User ${user} not found`, keyError: 'userNotFound'});
        }
        user.delete().then(u => {
            return res.status(200).json(u);
        }).catch( e => {
            return res.status(500).json({e});
        });

    }).catch((e) => {
        //SHOULD NEVER HAPPENED
        //TODO stop with shitty catch
        return res.status(400).json(e);
    });
});

module.exports = router;