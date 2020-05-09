
let Utils = {};

Utils.create_UUID = () => {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
};

Utils.similar = (a,b) => {
    let equivalency = 0;
    a = a.toLowerCase();
    b = b.toLowerCase();
    let minLength = (a.length > b.length) ? b.length : a.length;
    let maxLength = (a.length < b.length) ? b.length : a.length;
    for(let i = 0; i < minLength; i++) {
        if(a[i] == b[i]) {
            equivalency++;
        }
    }


    let weight = equivalency / maxLength;
    return weight;
}

Utils.getWeekday = () => {

    const d = new Date();
    const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    return weekday[d.getDay()];
}

Utils.isDateIncluded = (date, dMin, dMax) => {
    return Date.parse(date) > Date.parse(dMin) ? (Date.parse(date) < Date.parse(dMax) ? true : false) : false;
}

//If we store date with a simple datetime 1970 with correct hours/minute
// just compute time value from it
Utils.getTimeFromHourMinuteSeconde = () => {
    let date = new Date;
    return date.getSeconds() * 1000
        + date.getMinutes() * 60 * 1000
        + date.getHours() * 60 * 60 * 1000;
}

module.exports = Utils;