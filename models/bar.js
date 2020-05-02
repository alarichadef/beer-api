
const database = require('./db');
const BarModel = database.model('bars');

class Bar extends BarModel {
	constructor({
		name,
		address=null,
		location=null,
		type=null,
		tags=null,
		characteristics=null,
		happyHourTime=null,
		openingTime=null,
		privateaserBookingUrl=null,
		privateaserId=null,
		beers=null,
		keywords=null,
		minPrice=null,
		minPriceHappy=null
	}) {
		super();
		this.name=name,
		this.address=address,
		this.location=location,
		this.type=type,
		this.tags=tags,
		this.characteristics=characteristics,
		this.happyHourTime=happyHourTime,
		this.openingTime=openingTime,
		this.privateaserBookingUrl=privateaserBookingUrl,
		this.privateaserId=privateaserId,
		this.beers=beers,
		this.keywords=keywords,
		this.minPrice = minPrice;
		this.minPriceHappy = minPriceHappy;
    }
	//TODO implement toJson() method

}

module.exports = Bar;