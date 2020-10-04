const database = require('./db');
const UserModel = database.model('users');

class User extends UserModel {
    constructor( {username, email, password, isAdmin=false} ) {
        super();
        this.username = username;
        this.email = email;
        this.password = password;
        this.isAdmin = isAdmin;
    }

    toApi() {
        let {id, username, email, isAdmin} = this;
        return {
            id,
            username,
            email,
            isAdmin
        }
    }

    toExtendedApi() {
        let { id } = this;
        let aggregation_pipeline = [{
			'$match': {id}
		}];
        aggregation_pipeline.push({
			'$lookup': {
				from: 'favourite',
				localField: 'id',
				foreignField: 'userId',
				as: 'favourite'
			}
        }, {
            $unwind: {
              path: "$favourite",
              preserveNullAndEmptyArrays: true
            }
          },{
			'$lookup': {
				from: 'bars',
				localField: 'favourite.barId',
				foreignField: 'id',
				as: 'favourite.bar'
			}
        }, {
            $group: {
            _id : "$id",
            username: { $first: "$username" },
            email: { $first: "$email" },
            creation: { $first: "$__created" },
            favourites: { $push: "$favourite" },
            }
          });
        let cursor = User.aggregate(aggregation_pipeline);
        return cursor.toArray().then(user => {
            if(user.length > 1) {
				throw new Error(`Aggregate returned more than one object, it returned ${user.length}`);
            }
            user = user.shift();
            const favourites = user.favourites.map(favourite => {
                let bar = Bar.fromJSON(favourite.bar)?.[0];
                return {id: favourite.id, bar: bar.toApi()};
            });
            user.favourites = favourites;
            user.id = user._id;
            delete user._id;
            return user;
		});

    }

    static toListApi(users) {
		return users.map(user =>
			user.toApi()
		);
	}
}

module.exports = User;