//Middleware allowing to check if the logged user is admin
module.exports = (req, res, next) => {
    let user = req.user;
    if (!user.isAdmin) {
        return res.status(403).json({message: 'You do not have access to this page', keyError: 'forbiddenPage'});
    }
    return next();
}