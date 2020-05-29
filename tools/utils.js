const Crypto = require('crypto');

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

Utils.validateEmail = email => {
    return  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

Utils.validatePassword = password => {
    //Strong validation with lowercase, upperCase, Number, special chars and between 8,32
    //allowing to display the error found
    //Check every single condition separately
    let lowercase = password.match((/[a-z]+/g));
    let uppercase = password.match((/[A-Z]+/g));
    let digits = password.match((/[\d]+/g));
    let special = password.match((/[!@#$?%^&*_]+/g));
    let lenght = password.match((/[A-Za-z\d!@#$%^&*_]{8,32}/g));

    //  Array to store information about any mismatches in the string
    let errors = [];

    if (password === '' ) {
        errors.push('Password is required');
    }
    if (lowercase === null) {
        errors.push('Password must include at least one lowercase letter');
    }
    if (uppercase === null) {
        errors.push('Password must include at least one uppercase letter');
    }
    if (digits === null) {
        errors.push('Password must include at least one digit from 0 to 9');
    }
    if (special  === null) {
        errors.push('Password must include at least one special character');
    }
    if (lenght === null) {
        errors.push('Password must include at least 8 characters');
    }
    return errors;
}

Utils.hash = password => {
	let hash = Crypto.createHash('sha256');
	hash.update(password);
	return hash.digest('base64');
};

Utils.toB64 = string => {
    return Buffer.from(string).toString('base64');
}

Utils.fromB64 = b64 => {
    return Buffer.from(b64, 'base64').toString();
}

Utils.toB64Url = string => {
    return Utils.toB64(string).replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
};

Utils.b64toB64Url = b64 => {
    return b64.replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
};
  
Utils.fromB64Url = b64url => {
    b64url = b64url.replace(/\-/g, "+").replace(/\_/g, "/");
    while (b64url.length % 4)
    b64url += '=';
    return Utils.fromB64(b64url);
};

Utils.isValidBearer = token => {
    let parts = token.split(' ');
    if (parts.length !== 2) {
        return false;
    }

    let scheme = parts[0];
    let credentials = parts[1];

    if (!/^Bearer$/i.test(scheme)) {
        return false;
    }
    if (!credentials) {
        return false;
    }
    return credentials;
}

module.exports = Utils;