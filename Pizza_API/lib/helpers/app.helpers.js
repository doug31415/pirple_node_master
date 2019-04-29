/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Wed Jan 30 2019
 * --------------------------------- */

const crypto = require('crypto');
const config = require('../config');

const util = require('util');
const debug = util.debuglog('api_appHelpers');

const METHODS = {
    delete: 'delete',
    get: 'get',
    post: 'post',
    put: 'put'
}

const CHECK_STATE = {
    up: 'up',
    down: 'down'
}

const PROTOCOLS = {
    http: 'http',
    https: 'https'
}


const LOG_COLORS = {
    red: '\x1b[31m%s\x1b[0m',
    green: '\x1b[32m%s\x1b[0m',
    yellow: '\x1b[33m%s\x1b[0m',
    blue: '\x1b[34m%s\x1b[0m',
    purple: '\x1b[35m%s\x1b[0m',
    aqua: '\x1b[36m%s\x1b[0m',
}

const helpers = {
    METHODS,
    PROTOCOLS,
    CHECK_STATE,
    LOG_COLORS
}


// SHA256
helpers.hash = function (val) {
    debug('hash', val);
    let hashed = false;
    if (typeof val === 'string' && val.length > 0) {
        hashed = crypto.createHmac('sha256', config.hashSecret).update(val).digest('hex')
    }

    return hashed;
}

helpers.parseJsonStr = function (str) {
    debug('.helpers.parseJsonStr');
    debug('...str', str);

    if (!str) {
        return {}
    }

    try {
        return JSON.parse(str)
    } catch (err) {
        debug('...err', err);
        return {}
    }
}

helpers.createRandomString = function (strLen) {
    strLen === (typeof strLen === 'number' && strLen > 0) ? strLen : false;

    if (!strLen) {
        return false;
    }

    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charsLen = chars.length;
    let rand = 0
    let randString = ''
    for (let i = 0; i < strLen; i++) {
        rand = Math.floor(Math.random() * charsLen)
        randString += chars[rand];
    }
    debug('...randString', randString);
    debug('...len', randString.length);
    return randString
}

helpers.validateString = function (val, minLen = 1, maxLen = Number.POSITIVE_INFINITY) {
    debug('...val', val);
    debug('...minLen', minLen);
    debug('...maxLen', maxLen);
    debug('...len', val && val.length);
    debug('..........................');
    return (typeof val === 'string' && val.trim().length >= minLen && val.trim().length <= maxLen) ?
        val.trim() :
        false
}

helpers.validateNumber = function (val, minLen = 0, maxLen = Number.POSITIVE_INFINITY) {
    debug('...val', val);
    debug('...minLen', minLen);
    debug('...maxLen', maxLen);
    debug('...len', val && val.length);
    debug('..........................');
    return (typeof val === 'number' && val >= minLen && val <= maxLen) ?
        val :
        false
}

helpers.validateArray = function (arr, minLen = 0) {
    return (typeof arr === 'object' && arr instanceof Array && arr.length >= minLen) ?
        arr :
        false
}

helpers.validateTokenFromHeader = (token) => {
    return typeof token === 'string' ? token : false;
}

/**
 * @param email
 * accepts a string and ensures that there is an '@' and a '.'
 * returns the string itself or false if validation fails
 */
helpers.validateEmail = (emai) => {
    return (helpers.validateString(email) && email.indexOf('@') > -1 && email.indexOf('.') > -1) ? email : false;
}

/**
 * @param email
 * alpha.o@beta.com => alpha_omega_beta_com
 */
helpers.filenameFromEmail = (email) => {
    return email.replace('@', '_').replace('.', '_');
}

module.exports = helpers;