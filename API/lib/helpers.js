/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Wed Jan 30 2019
 * --------------------------------- */

const crypto = require('crypto');
const config = require('./config');

const METHODS = {
    delete: 'DELETE',
    get: 'GET',
    post: 'POST',
    put: 'PUT',
}

const helpers = {
    METHODS
}

// SHA256
helpers.hash = function (val) {
    let hashed = false;
    if (typeof val === 'string' && val.length > 0) {
        hashed = crypto.createHmac('sha256', config.hashSecret).update(val).digest('hex')
    }

    return hashed;
}

helpers.parseJsonStr = function (str) {
    // console.log('.helpers.parseJsonStr', str);
    // console.log('...str', str);

    if (!str) {
        return {}
    }

    try {
        return JSON.parse(str)
    } catch (err) {
        console.log('...err', err);
        return {}
    }
}

helpers.validateString = function (val, minLen = 1, maxLen = 100) {
    // console.log('...val', val);
    // console.log('...minLen', minLen);
    // console.log('...maxLen', maxLen);
    // console.log('...len', val.length);
    // console.log('..........................');
    return (typeof val === 'string' && val.trim().length >= minLen && val.trim().length <= maxLen) ?
        val.trim() :
        false
}

module.exports = helpers;