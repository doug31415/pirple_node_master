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
const debug = util.debuglog('api_checks');

const _appHelpers = require('../helpers/app.helpers');
const _data = require('../data');
const _config = require('../config');
const verifyToken = require('./tokens').verify;

// container
const checksRoute = {};

// ---------------------------------------
// user methods - public gateway method
checksRoute.routes = (data, callback) => {
    if (_appHelpers.allMethods.indexOf(data.method.toLowerCase()) !== -1) {
        checksRoute._routes[data.method.toLowerCase()](data, callback)
    } else {
        callback(405)
    }
}

// private user methods
checksRoute._routes = {}

/**
 * @param protocol string HTTP | HTTPS
 * @param url string 
 * @param method string GET | PUT | POST | DELETE
 * @param successCodes number
 * @param timeoutSeconds number in seconds 1 - 5
 * 
 */
checksRoute._routes.post = function (data, callback) {
    debug('checks post');
    const protocol = (_appHelpers.allProtocols.indexOf(data.payload.protocol) > -1) ?
        data.payload.protocol :
        false;

    const url = _appHelpers.validateString(data.payload.url, 1, 1000);

    const method = (_appHelpers.allMethods.indexOf(data.payload.method) > -1) ?
        data.payload.method :
        false;

    const successCodes = _appHelpers.validateArray(data.payload.successCodes, 1) ?
        data.payload.successCodes :
        false;

    const timeoutSeconds = (typeof data.payload.timeoutSeconds === 'number' &&
            data.payload.timeoutSeconds % 1 === 0 && /* whole number */
            data.payload.timeoutSeconds > 0 &&
            data.payload.timeoutSeconds <= 5) ?
        data.payload.timeoutSeconds :
        false;

    debug('...protocol', protocol);
    debug('...url', url);
    debug('...method', method);
    debug('...successCodes', successCodes);
    debug('...timeoutSeconds', timeoutSeconds);

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // see if theres a token
        const token = _appHelpers.validateTokenFromHeader(data.headers.token);
        debug('...token', token);

        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const phone = tokenData.phone;
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        let userChecks = _appHelpers.validateArray(userData.checks, 0) || [];
                        // validate user is under max checks
                        if (userChecks.length < _config.maxChecks) {
                            // create new check
                            const checkId = _appHelpers.createRandomString(20);
                            const checkObj = {
                                id: checkId,
                                userPhone: userData.phone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds
                            }
                            _data.create('checks', checkId, checkObj, err => {
                                if (!err) {
                                    // update user
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);
                                    _data.update('users', phone, userData, err => {
                                        if (!err) {
                                            callback(200, checkObj)
                                        } else {
                                            callback(500, {
                                                error: err
                                            })
                                        }
                                    });
                                } else {
                                    callback(500, {
                                        error: 'could not save check'
                                    })
                                }
                            })
                        } else {
                            callback(400, {
                                error: `User already has max number of checks (${_config.maxChecks})`
                            })
                        }
                    } else {
                        callback(403, {
                            error: 'Token invalid'
                        })
                    }
                })
            } else {
                callback(403, {
                    error: 'Token invalid'
                })
            }
        })
    } else {
        callback(400, {
            error: 'Invalid request'
        })
    }
}

/**
 * @param data.id string
 */
checksRoute._routes.get = function (data, callback) {
    debug('checks.get', data.queries.id)
    const id = _appHelpers.validateString(data.queries.id, 20, 20);

    _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
            if (id) {
                // get token from headers
                const token = _appHelpers.validateTokenFromHeader(data.headers.token);
                const phone = checkData.userPhone;

                // verify that the token is valid for the phone
                verifyToken(token, phone, tokenIsValid => {
                    if (tokenIsValid) {
                        _data.read('checks', id, (err, data) => {
                            if (!err) {
                                callback(200, data)
                            } else {
                                callback(404)
                            }
                        })
                    } else {
                        callback(403, {
                            error: 'Missing or invalid token'
                        })
                    }
                })
            } else {
                callback(400, {
                    error: 'Bad request'
                })
            }
        } else {
            callback(404, err)
        }
    })
}

/**
 * REQUIRED
 * @param id string 
 * 
 * OPTIONAL (must have at least one of these)
 * @param protocol string HTTP | HTTPS
 * @param url string 
 * @param method string GET | PUT | POST | DELETE
 * @param successCodes number
 * @param timeoutSeconds number in seconds 1 - 5
 * 
 */
checksRoute._routes.put = function (data, callback) {
    debug('checks put');

    const id = _appHelpers.validateString(data.payload.id, 20, 20);
    if (!id) return callback(400, 'Invalid request');

    const protocol = (_appHelpers.allProtocols.indexOf(data.payload.protocol) > -1) ?
        data.payload.protocol :
        false;

    const url = _appHelpers.validateString(data.payload.url, 1, 1000);

    const method = (_appHelpers.allMethods.indexOf(data.payload.method) > -1) ?
        data.payload.method :
        false;

    const successCodes = _appHelpers.validateArray(data.payload.successCodes, 1) ?
        data.payload.successCodes :
        false;

    const timeoutSeconds = (typeof data.payload.timeoutSeconds === 'number' &&
            data.payload.timeoutSeconds % 1 === 0 && /* whole number */
            data.payload.timeoutSeconds > 0 &&
            data.payload.timeoutSeconds <= 5) ?
        data.payload.timeoutSeconds :
        false;

    debug('...id', id);
    debug('...protocol', protocol);
    debug('...url', url);
    debug('...method', method);
    debug('...successCodes', successCodes);
    debug('...timeoutSeconds', timeoutSeconds);

    if (protocol || url || method || successCodes || timeoutSeconds) {

        // see if the check exists
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                // see if theres a token
                const token = _appHelpers.validateTokenFromHeader(data.headers.token);
                debug('...token', token);

                if (token) {
                    // update the check with data
                    if (protocol) {
                        checkData.protocol = protocol
                    }

                    if (url) {
                        checkData.url = url
                    }

                    if (method) {
                        checkData.method = method
                    }

                    if (successCodes) {
                        checkData.successCodes = successCodes
                    }

                    if (timeoutSeconds) {
                        checkData.timeoutSeconds = timeoutSeconds
                    }


                    // store the modifications
                    _data.update('checks', id, checkData, err => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, {
                                error: 'Update failed'
                            })
                        }
                    })

                } else {
                    callback(403, 'Invalid Request')
                }
            } else {
                callback(404, 'Not Found')
            }
        })
    } else {
        callback(400, {
            error: 'Invalid request'
        })
    }
}


/**
 * @param data.queries.id string
 */
checksRoute._routes.delete = function (data, callback) {
    debug('checks.delete', data.queries.id)
    const id = _appHelpers.validateString(data.queries.id, 20, 20);

    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                // get token from headers
                const token = _appHelpers.validateTokenFromHeader(data.headers.token);
                const phone = checkData.userPhone;

                // verify that the token is valid for the phone
                verifyToken(token, phone, tokenIsValid => {
                    if (tokenIsValid) {

                        // find the user - we need to update the checks array to remove this id
                        _data.read('users', phone, (err, userData) => {
                            if (!err && userData) {
                                let checks = _appHelpers.validateArray(userData.checks, 1, 5);
                                if (checks) {
                                    // remove this id from the checks
                                    userData.checks = userData.checks.filter(checkId => {
                                        return checkId !== id;
                                    });
                                    _data.update('users', phone, userData, err => {
                                        if (!err) {
                                            _data.delete('checks', id, (err, data) => {
                                                if (!err) {
                                                    callback(200, `Delete success: ${data}`)
                                                } else {
                                                    callback(404)
                                                }
                                            })
                                        } else {
                                            callback(500, 'Unable to find user')
                                        }
                                    })
                                } else {
                                    callback(400, {
                                        error: 'Checks array for this user is missing or invalid'
                                    })
                                }

                            } else {
                                callback(404, {
                                    error: 'User not found'
                                })
                            }
                        })
                    } else {
                        callback(403, {
                            error: 'Missing or invalid token'
                        })
                    }
                })
            } else {
                callback(400, {
                    error: 'Not Found'
                })
            }
        })
    } else {
        callback(400, {
            error: 'Missing or invalid id'
        })
    }
}

module.exports = checksRoute;