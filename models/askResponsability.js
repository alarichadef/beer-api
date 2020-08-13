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
        let {id, userId, barId, reason, pictures,studied, accepted} = this;
        return {id, reason, pictures, studied, accepted, userId, barId}
    }

    static toAggregate(askResponsabilities) {
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
		return cursor.toArray();
    }

    static toListApi(askResponsabilities) {
        return askResponsabilities.map(askResponsability => {
            let bar = Bar.fromJSON(askResponsability.bar)?.[0];
            let user = User.fromJSON(askResponsability.user)?.[0];
            return {id: askResponsability.id, bar: bar?.toApi() || null, user: user?.toApi() || null}
        });
    }

}

module.exports = AskResponsability;