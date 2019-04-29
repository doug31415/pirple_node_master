/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Thu Jan 31 2019
 * 
 * Routes for tokens
 * --------------------------------- */
const util = require('util');
const debug = util.debuglog('api_tokens');

const _appHelpers = require('../helpers/app.helpers');
const _data = require('../data');

const METHODS = _appHelpers.METHODS;

// container
const tokenService = {};

// ---------------------------------------
// user methods - public gateway method
tokenService.routes = (data, callback) => {
    if (_appHelpers.allMethods.indexOf(data.method.toLowerCase()) !== -1) {
        tokenService._routes[data.method.toLowerCase()](data, callback)
    } else {
        callback(405)
    }
}

// private user methods
tokenService._routes = {}

/**
 * @param data.id string
 */
tokenService._routes.get = function (data, callback) {
    debug('tokens.get', data.queries)
    const id = _appHelpers.validateString(data.queries.id, 20, 20);

    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err) {
                callback(200, data)
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, {
            error: 'Bad request'
        })
    }
}

/**
 * @param data.phone string
 * @param data.password string
 * @TODO only allow authenticated requests
 */
tokenService._routes.post = function (data, callback) {
    debug('tokens.post')
    const phone = _appHelpers.validateString(data.payload.phone, 10, 10);
    const password = _appHelpers.validateString(data.payload.password, 0);

    if (phone && password) {
        // ensure the user does exist
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                // hash the password
                const hashedPassword = _appHelpers.hash(password);
                if (hashedPassword === data.hashedPassword) {
                    // if valid create a new token with a random name
                    // with expiration date 1 hour in future

                    const tokenId = _appHelpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenConfig = {
                        phone,
                        id: tokenId,
                        expires
                    }

                    _data.create('tokens', tokenId, tokenConfig, err => {
                        if (!err) {
                            callback(200, tokenConfig)
                        } else {
                            callback(500, {
                                error: 'Token could not be created'
                            })
                        }
                    });
                } else {
                    callback(400, {
                        error: 'Password incorrect'
                    })
                }
            } else {
                callback(400, {
                    error: 'User does not exist'
                })
            }
        })
    } else {
        callback(400, {
            error: 'Missing required fields'
        })
    }
}

/**
 * @param data.phone string
 * @param extend true
 * @TODO only allow for authenticated tokenService
 * @TODO only allow tokenService to update their own data
 */
tokenService._routes.put = function (data, callback) {
    const tokenId = helpers.validateString(data.payload.id, 20, 20);
    const extend = (typeof data.payload.extend === 'boolean' && data.payload.extend === true) ? true : false;

    if (tokenId && extend) {
        // ensure the user does exist
        _data.read('tokens', tokenId, (err, currentToken) => {
            if (!err && currentToken) {
                // check that the token hasnt expired
                if (Date.now() <= currentToken.expires) {
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenConfig = {
                        ...currentToken,
                        expires
                    }

                    _data.update('tokens', tokenId, tokenConfig, err => {
                        if (!err) {
                            callback(200, tokenConfig)
                        } else {
                            callback(500, {
                                error: 'Token could not be updated'
                            })
                        }
                    });
                } else {
                    callback(400, {
                        error: 'This token has expired'
                    })
                }
            } else {
                callback(400, {
                    error: 'Token does not exist'
                })
            }
        })
    } else {
        callback(400, {
            error: 'Bad request'
        })
    }
}


/**
 * @param data.queries.phone string
 * @TODO only allow for authenticated tokenService
 * @TODO only allow tokenService to update their own data
 */
tokenService._routes.delete = function (data, callback) {
    const id = _appHelpers.validateString(data.queries.id, 20, 20);

    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                _data.delete('tokens', id, (err, data) => {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(500, {
                            error: 'Could not delete Token'
                        })
                    }
                })
            } else {
                callback(400, {
                    error: 'Token not found'
                })
            }
        })

    } else {
        callback(400, {
            error: 'Bad request'
        })
    }
}

/**
 * @param data.id string
 * @todo only allow for authenticated tokenService
 */
tokenService.verify = function (tokenId, phone, callback) {
    debug('tokens.verify', tokenId, phone)

    _data.read('tokens', tokenId, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.phone === phone && tokenData.expires > Date.now()) {
                callback(true)
            } else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}

module.exports = tokenService;