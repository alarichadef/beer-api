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
        let {id} = this;
        let aggregation_pipeline = [{
			'$match': {id}
		}];
        aggregation_pipeline.push({
			'$lookup': {
				from: 'users',
				localField: 'userId',
				foreignField: 'id',
				as: 'user'
			}
        }, {
			'$lookup': {
				from: 'bars',
				localField: 'barId',
				foreignField: 'id',
				as: 'bar'
			}
        });
        let cursor = Responsability.aggregate(aggregation_pipeline);
		cursor.toArray().then(resps => {
            if(resps.length > 1) {
				throw new Error(`Aggregate returned more than one object, it returned ${resps.length}`);
			}
            let resp = resps.shift();
            let bar = Bar.fromJSON(resp.bar)?.[0];
            let user = User.fromJSON(resp.user)?.[0];
            return {id, bar: bar?.toApi(), user: user?.toApi()}
		}).catch(e => console.warn('err', e));
    }
    toApiId() {
        let {barId} = this;
        return {barId};
    }

    static toAggregate(barUsers) {
        let aggregation_pipeline = [{
			'$match': {id: {$in: barUsers.map(barUser => barUser.id)}}
		}];
        aggregation_pipeline.push({
			'$lookup': {
				from: 'users',
				localField: 'userId',
				foreignField: 'id',
				as: 'user'
			}
        }, {
			'$lookup': {
				from: 'bars',
				localField: 'barId',
				foreignField: 'id',
				as: 'bar'
			}
        });
        let cursor = Responsability.aggregate(aggregation_pipeline);
		return cursor.toArray();
    }

    static toListApi(barUsers) {
        return barUsers.map(barUser => {
            let bar = Bar.fromJSON(barUser.bar)?.[0];
            let user = User.fromJSON(barUser.user)?.[0];
            return {id: barUser.id, bar: bar?.toApi() || null, user: user?.toApi() || null}
        });

    }

    static toListApiId(barUsers) {
        return barUsers.map(barUser =>
			barUser.toApiId()
		);
    }

}

module.exports = Responsability;