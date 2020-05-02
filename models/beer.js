
const database = require('./db');
const BeerModel = database.model('beers');

class Beer extends BeerModel {
	constructor({ name, picture=null, brewery=null, alcohol=null, type=null, description=null, rateBeer=null, ibu=null, descriptionObject = null, rateBeerUrl=null}={}) {
		super();
		this.name = name;
		this.picture = picture;
		this.brewery = brewery;
		this.alcohol = alcohol;
		this.type = type;
		this.description = description;
		this.rateBeer = rateBeer;
		this.ibu = ibu;
		this.descriptionObject = descriptionObject
		this.rateBeerUrl = rateBeerUrl
    }

}

module.exports = Beer;