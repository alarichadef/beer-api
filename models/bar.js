
const database = require('./db');
const BarModel = database.model('bars');

class Bar extends BarModel {
	constructor({ name, coordinates }={}) {
		super();
		this.name = name;
		this.coordinates = coordinates;
    }
    //TODO implement toJson() method
}

module.exports = Bar;