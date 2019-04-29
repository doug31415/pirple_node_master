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
const _data = require('../helpers/data.helpers');
const verifyToken = require('./tokens').verify;

const METHODS = _appHelpers.METHODS;

// container
const userService = {};

// ---------------------------------------
// user methods - public gateway method
userService.routes = (data, callback) => {
    debug('user method', data.method)
    if (Object.values(_appHelpers.METHODS).indexOf(data.method.toLowerCase()) !== -1) {
        userService._routes[data.method.toLowerCase()](data, callback)
    } else {
        callback(405, `the method ${data.method} is not allowed`)
    }
}

// private user methods
userService._routes = {}



/**
 * @param data.firstname string
 * @param data.lastname string
 * @param data.email string
 * @param data.street string
 * @param data.city string
 * @param data.state string
 * @param data.zip string
 */
userService._routes.post = function (data, callback) {
    const validatedFields = getValidatedFields(data.payload);
    debug('...data', data.payload);
    debug('...validatedFields', validatedFields);

    if (validatedFields.allValid) {

        const {
            firstname,
            lastname,
            email,
            street,
            city,
            state,
            zip
        } = validatedFields;

        const hashedEmail = _appHelpers.filenameFromEmail(email);
        debug('...hashedEmail', hashedEmail);

        _data.read('users', hashedEmail, (err, data) => {
            if (err) {
                // user doesnt exist

                if (hashedEmail) {
                    const userData = {
                        firstname,
                        lastname,
                        email,
                        street,
                        city,
                        state,
                        zip
                    }

                    // store user
                    _data.create('users', hashedEmail, userData, err => {
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
                    error: 'email is not valid or already exists'
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
 * @param data.email string
 */
userService._routes.get = function (data, callback) {
    debug('users.get', data.queries.email)
    const email = _appHelpers.validateEmail(data.queries.email);

    if (email) {
        // get token from headers
        const token = _appHelpers.validateTokenFromHeader(data.headers.token);
        debug('...token', token)

        // verify that the token is valid for the email
        verifyToken(token, email, tokenIsValid => {
            debug('...tokenIsValid', tokenIsValid)
            if (tokenIsValid) {
                const hashedEmail = _appHelpers.filenameFromEmail(email)
                _data.read('users', hashedEmail, (err, data) => {
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
}

/**
 * @param data.email string
 */
userService._routes.put = function (data, callback) {
    debug('users.put');

    const validatedFields = getValidatedFields(data.payload);
    debug('...data', data.payload);
    debug('...validatedFields', validatedFields);


    if (validatedFields.email &&
        (validatedFields.firstname ||
            validatedFields.lastname ||
            validatedFields.street ||
            validatedFields.city ||
            validatedFields.state ||
            validatedFields.zip)) {

        // get token from headers
        const token = _appHelpers.validateTokenFromHeader(data.headers.token);
        const hashedEmail = _appHelpers.filenameFromEmail(validatedFields.email);

        // verify that the token is valid for the phone
        verifyToken(token, validatedFields.email, tokenIsValid => {
            debug('...tokenIsValid', tokenIsValid);

            if (tokenIsValid) {
                // ensure the user does exist
                _data.read('users', hashedEmail, (err, data) => {
                    if (!err && data) {
                        // user does exist

                        const {
                            firstname,
                            lastname,
                            email,
                            street,
                            city,
                            state,
                            zip
                        } = validatedFields;

                        if (firstname) {
                            data.firstname = firstname
                        }
                        if (lastname) {
                            data.lastname = lastname
                        }
                        if (street) {
                            data.street = street
                        }
                        if (city) {
                            data.city = city
                        }
                        if (state) {
                            data.state = state
                        }
                        if (zip) {
                            data.zip = zip
                        }

                        // store user
                        _data.update('users', hashedEmail, data, err => {
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
                callback(403, {
                    error: 'Not authorized'
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
 * @param data.queries.email string
 */
userService._routes.delete = function (data, callback) {
    debug('users.delete', data.queries);

    const email = _appHelpers.validateString(data.queries.email);
    debug('...email', email);

    if (email) {
        // get token from headers
        const token = _appHelpers.validateTokenFromHeader(data.headers.token);
        debug('...token', token);

        // verify that the token is valid for the email
        verifyToken(token, email, tokenIsValid => {
            debug('...tokenIsValid', tokenIsValid);
            if (tokenIsValid) {
                // ensure the user does exist
                const hashedEmail = _appHelpers.filenameFromEmail(email);
                _data.read('users', hashedEmail, (err, userData) => {
                    if (!err && userData) {
                        _data.delete('users', hashedEmail, (err, data) => {
                            if (!err) {
                                let orders = _appHelpers.validateArray(userData.orders, 1);
                                debug('...orders', orders);

                                if (orders) {
                                    let deleteCount = 0;
                                    let deletionErrors = false;
                                    orders.forEach(orderId => {
                                        _data.delete('orders', orderId, err => {
                                            debug('...delete order', err)
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            deleteCount++
                                            debug('...deleteCount', deleteCount)
                                            debug('...deletionErrors', deletionErrors)
                                            if (orders.length === deleteCount) {
                                                if (!deletionErrors) {
                                                    callback(200, 'User deleted')
                                                } else {
                                                    callback(500, {
                                                        error: 'User could not be deleted - all orders may not be deleted'
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
                                    error: 'Could not delete User: ' + err
                                })
                            }
                        })
                    } else {
                        callback(400, {
                            error: 'User not found: ' + err
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
            error: 'Bad request' + err
        })
    }
}

const getValidatedFields = (payload) => {
    const firstname = _appHelpers.validateString(payload.firstname);
    const lastname = _appHelpers.validateString(payload.lastname);
    const email = _appHelpers.validateString(payload.email);
    const street = _appHelpers.validateString(payload.street, 1, 100);
    const city = _appHelpers.validateString(payload.city, 1, 100);
    const state = _appHelpers.validateString(payload.state, 2, 2);
    const zip = _appHelpers.validateString(payload.zip, 5, 5);

    debug('...firstname', firstname);
    debug('...lastname', lastname);
    debug('...email', email);
    debug('...street', street);
    debug('...city', city);
    debug('...state', state);
    debug('...zip', zip);

    const validatedFields = {
        firstname,
        lastname,
        email,
        street,
        city,
        state,
        zip,
        allValid: (firstname && lastname && email && street && city && state && zip)
    }

    return validatedFields
}

module.exports = userService;