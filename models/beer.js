
const database = require('./db');
const BeerModel = database.model('beers');

class Beer extends BeerModel {
	constructor({ name, picture, brewery, alcohol, type, description }={}) {
		super();
		this.name = name;
		this.picture = picture;
		this.brewery = brewery;
		this.alcohol = alcohol;
		this.type = type;
		this.description = description;
    }
    //TODO implement toJson() method
}

module.exports = Beer;