//Midleware allowing to check if the user in post/get params corresponds to the user sending the request
module.exports = (req, res, next) => {
    let user = req.user;
    // if the user is admin, he's got access to every page
    if (user.isAdmin) {
        return next();
    }
    let { userId } = req.body;
    if (!userId) {
        userId = req.params.userId
    }
    if (!userId) {
        return res.status(400).json({message: 'Missing user Id', keyError: 'missingFields'});
    }

    if (userId !== req.user.id) {
        return res.status(403).json({message: "You don't have access to this page", keyError: 'notUser'});
    }
    return next();

}