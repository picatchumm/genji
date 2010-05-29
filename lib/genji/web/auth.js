/**
 * Try to implement secured cookie described in this pubilcation:
 * A Secure Cookie Protocol (http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.92.7649&rep=rep1&type=pdf)
 *
 * More about salted hash, goto:
 * http://phpsec.org/articles/2005/password-hashing.html or http://www.aspheute.com/english/20040105.asp
 *
 * @todo more secured way (e.g. http://gitorious.com/django-password-model)
 */

var c = require('crypto'),
base64 = require('../utils').base64;
var sha1 = function(data) {
    return c.createHash('sha1').update(data).digest('hex');
}
var hmac_sha1 = function(data, key) {
    return c.createHmac('sha1', key).update(data).digest('hex');
}

function sign(username, expiration, data, serverKey) {
    var k = hmac_sha1([username, expiration].join("|"), serverKey);
    if (typeof data !== "string") data = JSON.stringify(data);
    var raw = [username, expiration, data].join("|");
    return raw + "|" + hmac_sha1(raw, k);
}

function verify(input, serverKey) {
    if (typeof input !== "string") return false;
    var values = input.split("|");
    if (values.length !== 4) return false;
    if (new Date >= new Date(values[1])) return false;
    var k = hmac_sha1([values[0], values[1]].join("|"), serverKey);
    return values.pop().replace(/[\x00-\x20]/g, "") === hmac_sha1(values.join("|"), k) ? values : false;
}

function checkPassword(password, raw) {
    var pass = password.split("$");
    if (pass.length == 2) 
        // "salt$hash"
        return pass[1] == sha1(pass[0] + raw);
    if (pass.length == 3) 
        // "algo$salt$hash"
            if (pass[0] == "sha1")
                return pass[2] == sha1(pass[1] + raw);
    return false;
}

function makePassword(raw) {
    var salt = sha1("" + Math.random() + Math.random()).slice(0, 9);
    return salt + "$" + sha1(salt + raw);
}

// example for how to use the above functions

function checkLogin(handler, serverKey) {
    var cookie = handler.getCookie("_acn");
    if (cookie) {
        return verify(base64.decode(cookie), serverKey);
    }
    return false;
}

function login(handler, user, credential, serverKey, data) {
    if (checkPassword(credential, user["password"])) {
        var expire =new Date(+ new Date + 7*24*3600*1000);
        var c = sign(user['username'], expire, data, serverKey);
        handler.setCookie("_acn", base64.encode(c), {expires: expire, path: "/"});
        return true;
    } else {
        return false;
    }
}

function logout(handler) {
    handler.clearCookie("_acn", {path: "/"});
}

exports.sign = sign;
exports.verify = verify;
exports.checkPassword = checkPassword;
exports.makePassword = makePassword;
exports.checkLogin = checkLogin;
exports.login = login;
exports.logout = logout;