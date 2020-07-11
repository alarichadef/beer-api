const database = require('./db');
const FavouriteModel = database.model('favourite');

class Favourite extends FavouriteModel {

    constructor( {userId, barId} ) {
        super();
        this.userId = userId;
        this.barId = barId;
    }

    toApi() {
        let {id, userId, barId} = this;
        return  {id, userId, barId}
    }

    toApiId() {
        let {barId} = this;
        return {barId};
    }

    static toListApi(favourites) {
		return favourites.map(favourite =>
			favourite.toApi()
		);
    }

    static toListApiId(favourites) {
        return favourites.map(favourite =>
			favourite.toApiId()
		);
    }

}

module.exports = Favourite;