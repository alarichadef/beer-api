const { Database } = require('@jsmrcaga/mongo');

const database = new Database('main', {
	protocol: 'mongodb+srv',
	username: 'alaric',
	password: 'bierebelge',
	endpoint: 'cluster0-dstvq.mongodb.net',
	database: 'test',
	query: '?retryWrites=true&w=majority',
	useUnifiedTopology: true
});
database.connect().then(() => console.log('ok')).catch(() => console.log('error'));
module.exports = database;