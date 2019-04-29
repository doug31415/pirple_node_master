/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Thu Jan 31 2019
 * 
 * Routes for userService
 * --------------------------------- */
const util = require('util');
const debug = util.debuglog('api_users');

const _appHelpers = require('../helpers/app.helpers');
const _data = require('../data');
const verifyToken = require('./tokens').verify;

const METHODS = _appHelpers.METHODS;

// container
const userService = {};

// ---------------------------------------
// user methods - public gateway method
userService.routes = (data, callback) => {
    debug('user method', data.method)
    if (_appHelpers.allMethods.indexOf(data.method.toLowerCase()) !== -1) {
        userService._routes[data.method.toLowerCase()](data, callback)
    } else {
        callback(405, `the method ${data.method} is not allowed`)
    }
}

// private user methods
userService._routes = {}

/**
 * @param data.phone string
 */
userService._routes.get = function (data, callback) {
    debug('users.get', data.queries.phone)
    const phone = _appHelpers.validateString(data.queries.phone, 10, 10);

    if (phone) {
        // get token from headers
        const token = _appHelpers.validateTokenFromHeader(data.headers.token);
        debug('...token', token)

        // verify that the token is valid for the phone
        verifyToken(token, phone, tokenIsValid => {
            debug('...tokenIsValid', tokenIsValid)
            if (tokenIsValid) {
                _data.read('users', phone, (err, data) => {
                    if (!err) {
                        // removed hashed pw from object
                        delete data.hashedPassword;
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
}

/**
 * @param data.firstname string
 * @param data.lastname string
 * @param data.phone string
 * @param data.password string
 * @param data.tosAgreement bool
 * @TODO only allow for authenticated userService?
 */
userService._routes.post = function (data, callback) {
    requiredFieldsAreValid = getRequiredFieldsAreValid(data.payload);
    debug('...data', data.payload);
    debug('...requiredFieldsAreValid', requiredFieldsAreValid);

    if (requiredFieldsAreValid) {

        const firstname = data.payload.firstname;
        const lastname = data.payload.lastname;
        const phone = data.payload.phone;
        const password = data.payload.password;
        const tosAgreement = data.payload.tosAgreement;

        _data.read('users', phone, (err, data) => {
            if (err) {
                // user doesnt exist
                // hash the password
                const hashedPassword = _appHelpers.hash(password);

                if (hashedPassword) {
                    const userData = {
                        firstname,
                        lastname,
                        phone,
                        hashedPassword,
                        tosAgreement
                    }

                    // store user
                    _data.create('users', phone, userData, err => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, {
                                error: 'User not created',
                                mssg: err
                            })
                        }
                    })
                }
            } else {
                callback(403, {
                    error: 'Password is not valid'
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
 */
userService._routes.put = function (data, callback) {
    debug('users.put data:', data)
    const firstname = _appHelpers.validateString(data.payload.firstname);
    const lastname = _appHelpers.validateString(data.payload.lastname);
    const phone = _appHelpers.validateString(data.payload.phone, 10, 10);
    const password = _appHelpers.validateString(data.payload.password, 0);

    debug('...firstname', firstname);
    debug('...lastname', lastname);
    debug('...phone', phone);
    debug('...password', password);

    if (phone && (firstname || lastname || password)) {

        // get token from headers
        const token = _appHelpers.validateTokenFromHeader(data.headers.token);

        // verify that the token is valid for the phone
        verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
                // ensure the user does exist
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        // user does exist

                        if (firstname) {
                            data.firstname = firstname
                        }
                        if (lastname) {
                            data.lastname = lastname
                        }
                        if (password) {
                            data.hashedPassword = _appHelpers.hash(password);
                        }

                        // store user
                        _data.update('users', phone, data, err => {
                            if (!err) {
                                callback(200)
                            } else {
                                callback(500, {
                                    error: 'User not updated',
                                    mssg: err
                                })
                            }
                        })
                    } else {
                        callback(400, {
                            error: 'User doesnt exist'
                        })
                    }
                })
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, {
            error: 'Missing required fields'
        })
    }
}

/**
 * @param data.queries.phone string
 */
userService._routes.delete = function (data, callback) {
    debug('users.delete', data.queries);

    const phone = _appHelpers.validateString(data.queries.phone, 10, 10);
    debug('...phone', phone);

    if (phone) {
        // get token from headers
        const token = _appHelpers.validateTokenFromHeader(data.headers.token);
        debug('...token', token);

        // verify that the token is valid for the phone
        verifyToken(token, phone, tokenIsValid => {
            debug('...tokenIsValid', tokenIsValid);
            if (tokenIsValid) {
                // ensure the user does exist
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        _data.delete('users', phone, (err, data) => {
                            if (!err) {
                                let checks = _appHelpers.validateArray(userData.checks);
                                debug('...checks', checks)
                                if (checks.length) {
                                    let deleteCount = 0;
                                    let deletionErrors = false;
                                    checks.forEach(check => {
                                        _data.delete('checks', check, err => {
                                            debug('...delete checks', err)
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            deleteCount++
                                            debug('...deleteCount', deleteCount)
                                            debug('...deletionErrors', deletionErrors)
                                            if (checks.length === deleteCount) {
                                                if (!deletionErrors) {
                                                    callback(200, 'Checks deleted')
                                                } else {
                                                    callback(500, {
                                                        error: 'Checks could not be deleted - all checks may not be deleted'
                                                    })
                                                }
                                            }
                                        })
                                    })
                                } else {
                                    callback(200, 'Delete success')
                                }
                            } else {
                                callback(500, {
                                    error: 'Could not delete User'
                                })
                            }
                        })
                    } else {
                        callback(400, {
                            error: 'User not found'
                        })
                    }
                })
            } else {
                callback(404, {
                    error: 'Missing or invalid token'
                })
            }
        })
    } else {
        callback(403, {
            error: 'Bad request'
        })
    }
}

const getRequiredFieldsAreValid = (payload) => {
    const firstname = _appHelpers.validateString(payload.firstname);
    const lastname = _appHelpers.validateString(payload.lastname);
    const phone = _appHelpers.validateString(payload.phone, 10, 10);
    const password = _appHelpers.validateString(payload.password, 0);
    const tosAgreement = (typeof payload.tosAgreement === 'boolean' && !!payload.tosAgreement) ? true : false;

    debug('...firstname', firstname);
    debug('...lastname', lastname);
    debug('...phone', phone);
    debug('...password', password);
    debug('...tosAgreement', tosAgreement);

    return (firstname && lastname && phone && password && tosAgreement)
}

module.exports = userService;