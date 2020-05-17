
const database = require('./db');
const BarModel = database.model('bars');
const Utils = require('../tools/utils');

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

	//Take an array of bars and format it with the good data for the list API
	static toListApi(bars) {
		return bars.map(bar => {
			let {id, name, location, tags, address} = bar
			return {
				id,
				name,
				address,
				location,
				tags,
				opened: bar.isOpened(),
				inHappy: bar.isHH(),
				cheapestBeer: bar.cheapestBeer
			}
		})
	}

	//Current bar object format to be sent through api
	toApi() {
		let {id, name, address, location, tags, type, characteristics, happyHourTime, openingTime, privateaserId, privateaserBookingUrl, beers, keywords} = this;
		return {
			id,
			name,
			location,
			address,
			tags,
			type,
			characteristics,
			happyHourTime,
			openingTime,
			privateaserBookingUrl,
			privateaserId,
			beers,
			keywords,
			opened: this.isOpened(),
			inHappy: this.isHH(),
			cheapestBeer: this.cheapestBeer
		}
	}

	//Compute if it's opened
	isOpened() {
		let day = Utils.getWeekday();
		let openingDay = this.openingTime[day];
		//If we don't have the opening time for the current day
		if (!openingDay) {
			return false;
		}
		let current = new Date(Utils.getTimeFromHourMinuteSeconde());
		current = current.toISOString();
		return Utils.isDateIncluded(current, openingDay.opening, openingDay.closing)
	}

	//Compute if it's in HH
	isHH() {
		let day = Utils.getWeekday();
		let hHDay = this.happyHourTime[day];
		//If we don't have the opening time for the current day
		if (!hHDay) {
			return false;
		}
		let current = new Date(Utils.getTimeFromHourMinuteSeconde());
		current = current.toISOString();
		return Utils.isDateIncluded(current, hHDay.start, hHDay.end)
	}

	//Return price of the cheapest beer of the bar
	get cheapestBeer() {
		if (!this.beers.length) {
			return this.minPriceHappy ? this.minPrice ? Math.min(this.minPrice, this.minPriceHappy) : this.minPriceHappy : this.minPriceHappy;
		};
		let cheapestBeer = Math.min.apply(null, this.beers.map(beer => {
			return beer.priceHappy ? beer.priceBeer ? Math.min(beer.priceHappy, beer.priceBeer) : beer.priceHappy : beer.priceBeer;
		}));
		return cheapestBeer;
	}

}
module.exports = Bar;