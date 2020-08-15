const database = require('./db');
const AskResponsabilityModel = database.model('ask-bar-user');
const Bar = require('./bar');
const User = require('./user');

//Allowing to know which user got responsability of which bar and vice-versa
//TODO: add a declinedreason to explain why it's declined and display it to the user
//Maybe send email when accepted/declined ?
class AskResponsability extends AskResponsabilityModel {
    constructor( {userId, barId, reason=null, pictures=[], studied=false, accepted=null} ) {
        super();
        this.userId = userId;
        this.barId = barId;
        this.reason=reason;
        this.pictures=pictures;
        this.studied=studied;
        this.accepted=accepted;
    }
    //Todo: add other toApi method for bar and user with less or more informations
    toApi() {
        let {id, reason, pictures,studied, accepted} = this;
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
        let cursor = AskResponsability.aggregate(aggregation_pipeline);
		return cursor.toArray().then(resps => {
            if(resps.length > 1) {
				throw new Error(`Aggregate returned more than one object, it returned ${resps.length}`);
            }
            let resp = resps.shift();
            let bar = Bar.fromJSON(resp.bar)?.[0];
            let user = User.fromJSON(resp.user)?.[0];
            return {id, reason, pictures, studied, accepted, bar: bar?.toApi(), user: user?.toApi()}
		});

    }

    static toListApi(askResponsabilities) {
        let aggregation_pipeline = [{
			'$match': {id: {$in: askResponsabilities.map(askResponsability => askResponsability.id)}}
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
        let cursor = AskResponsability.aggregate(aggregation_pipeline);
		return cursor.toArray().then(askResponsabilities => {
            return askResponsabilities.map(askResponsability => {
                let {id, reason, pictures,studied, accepted} = askResponsability;
                let bar = Bar.fromJSON(askResponsability.bar)?.[0];
                let user = User.fromJSON(askResponsability.user)?.[0];
                return { id,reason,studied, accepted, pictures, bar: bar?.toApi() || null, user: user?.toApi() || null}
            });
        });
    }

}

module.exports = AskResponsability;