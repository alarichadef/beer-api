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

    static toListApi(users) {
		return users.map(user =>
			user.toApi()
		);
	}
}

module.exports = User;