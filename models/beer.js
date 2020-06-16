
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

	toApi() {
		let {
			name,
			picture,
			brewery,
			alcohol,
			type,
			description,
			ibu,
			descriptionObject,
		} = this;

		return {
			name,
			picture,
			brewery,
			alcohol,
			type,
			description,
			ibu,
			descriptionObject,
		}

	}

	toNameApi() {
		return this.name
	}

	static toListApi(beers) {
		return beers.map(beer =>
			beer.toApi()
		)
	}

	static toListNameApi(beers) {
		return beers.map(beer =>
			beer.toNameApi()
		)
	}

}

module.exports = Beer;