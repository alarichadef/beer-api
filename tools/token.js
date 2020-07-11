const Utils = require('./utils');
const Crypto = require('crypto');

class Token {

    static sign(payload, header) {
		let hmac = Crypto.createHmac('sha256', process.env.SECRET_TOKEN || 'alaricisthebestdevintheworld');
        hmac.update(header+'.'+payload);
		return Utils.b64toB64Url(hmac.digest('base64'));
    }

    static header() {
        return { alg: 'HS256', typ: 'jwt' };
    }

    static parse(token) {
        try {
            let [header, payload, sign] = token.split('.');
            payload = JSON.parse(Utils.fromB64Url(payload));
            header = JSON.parse(Utils.fromB64Url(header));
            return {header, payload, sign}
        } catch {
            return null;
        }
    }
    
    static verify(token) {
        let _token = this.parse(token);
        if (!_token) {
            return {error: "Error while parsing token", token}
        }
        let {payload, sign, header} = _token;
        let _sign = this.sign(Utils.toB64Url(JSON.stringify(payload)), Utils.toB64Url(JSON.stringify(header)));
        if (_sign !== sign) {
            return {error: "Token not valid", token: _token}
        }
        if (payload.exp < Date.now()) {
            return {error: "Token expired", token: _token}
        }
        return {error: false, token: _token};
    }

    static create_payload(user, bars, favourites) {
        let { id, username, email, isAdmin} = user;
        let payload = {
            sub: id,
            username,
            email,
            isAdmin,
            bars,
            favourites,
            exp: Date.now() + 1000 * 60 * 60 //1h le token ?
        }
        return payload;
    }

    static create_token(user, bars=[], favourites=[]) {
        let payload = Utils.toB64Url(JSON.stringify(this.create_payload(user, bars, favourites)));
        let header = Utils.toB64Url(JSON.stringify(this.header()));
        let sign = this.sign(payload, header);
        return `${header}.${payload}.${sign}`;
    }

    static create_token_from_payload(payload) {
        payload = Utils.toB64Url(JSON.stringify(payload));
        let header = Utils.toB64Url(JSON.stringify(this.header()));
        let sign = this.sign(payload, header);
        return `${header}.${payload}.${sign}`;
    }

    static refresh(token) {
        let _token = this.parse(token);
        if (!_token) {
            return {error: "Error while parsing token", token}
        }
        let {payload} = _token;
        payload.exp = Date.now() + 1000 * 60 * 60;
        return this.create_token_from_payload(payload);
    }
}

module.exports = Token;