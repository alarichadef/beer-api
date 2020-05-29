const database = require('./db');
const ResponsabilityModel = database.model('bar-user');
const Bar = require('./bar');
const User = require('./user');

//Allowing to know which user got responsability of which bar and vice-versa
class Responsability extends ResponsabilityModel {
    constructor( {userId, barId} ) {
        super();
        this.userId = userId;
        this.barId = barId;
    }
    //TODO: improve here
    toApi() {
        let {id, userId, barId} = this;
        return  {id, userId, barId}
    }
    toApiId() {
        let {barId} = this;
        return {barId};
    }

    static toListApi(barUsers) {
		return barUsers.map(barUser =>
			barUser.toApi()
		);
    }

    static toListApiId(barUsers) {
        return barUsers.map(barUser =>
			barUser.toApiId()
		);
    }
    

}

module.exports = Responsability;