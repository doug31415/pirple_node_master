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
const _data = require('../helpers/data.helpers');

const METHODS = _appHelpers.METHODS;

// container
const tokenService = {};

// ---------------------------------------
// user methods - public gateway method
tokenService.routes = (data, callback) => {
    if (Object.values(METHODS).indexOf(data.method.toLowerCase()) !== -1) {
        tokenService._routes[data.method.toLowerCase()](data, callback)
    } else {
        callback(405)
    }
}

// private user methods
tokenService._routes = {}


/**
 * @param data.email string
 * @TODO only allow authenticated requests
 */
tokenService._routes.post = function (data, callback) {
    debug('tokens.post')
    const email = _appHelpers.validateString(data.payload.email);

    if (email) {
        // ensure the user does exist
        const hashedEmail = _appHelpers.filenameFromEmail(email);
        _data.read('users', hashedEmail, (err, userData) => {
            if (!err && userData) {
                // create a token
                const tokenId = _appHelpers.createRandomString(20)
                // expires an hour from now
                const expires = Date.now() + 1000 * 60 * 60;
                const tokenConfig = {
                    email,
                    id: tokenId,
                    expires
                }

                _data.create('tokens', tokenId, tokenConfig, err => {
                    if (!err) {
                        callback(200, tokenConfig)
                    } else {
                        callback(500, {
                            error: 'Could not create token'
                        })
                    }
                })
            } else {
                callback(404, {
                    error: 'User does not exist'
                })
            }
        })
    } else {
        callback(404, {
            error: 'Email is not valid'
        })
    }
}

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
 * @param extend true
 */
tokenService._routes.put = function (data, callback) {
    debug('...data', data.payload);
    const tokenId = _appHelpers.validateString(data.payload.id, 20, 20);
    const extend = (typeof data.payload.extend === 'boolean' && data.payload.extend === true) ? true : false;

    if (tokenId && extend) {

        // get token from headers
        const token = _appHelpers.validateTokenFromHeader(data.headers.token);
        debug('...token', token)
        debug('...matches', token === tokenId)

        if (token === tokenId) {
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
            callback(403, {
                error: 'Not authorized - tokens dont match'
            })
        }
    } else {
        callback(400, {
            error: 'Bad request'
        })
    }
}


/**
 * @param data.queries.email string
 */
tokenService._routes.delete = function (data, callback) {
    const tokenId = _appHelpers.validateString(data.queries.id, 20, 20);

    // get token from headers
    const token = _appHelpers.validateTokenFromHeader(data.headers.token);
    debug('...token', token)
    debug('...matches', token === tokenId)

    if (tokenId && token === tokenId) {
        _data.read('tokens', tokenId, (err, data) => {
            if (!err && data) {
                _data.delete('tokens', tokenId, (err, data) => {
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
tokenService.verify = function (tokenId, email, callback) {
    debug('tokens.verify', tokenId, email)

    _data.read('tokens', tokenId, (err, tokenData) => {
        debug('...err', err);
        debug('...tokenData', tokenData);
        debug('...email valid', tokenData && tokenData.email, email);
        debug('...expiration valid', tokenData && tokenData.expires > Date.now());

        if (!err && tokenData) {
            if (tokenData.email === email && tokenData.expires > Date.now()) {
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