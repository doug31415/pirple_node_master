/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Thu Jan 31 2019
 * 
 * Routes for userRoutes
 * --------------------------------- */

const helpers = require('../helpers');
const _data = require('../data');

const METHODS = helpers.METHODS;

// container
const userRoutes = {};

// ---------------------------------------
// user methods - public gateway method
userRoutes.userRoutes = (data, callback) => {
    const allowedMethods = [METHODS.delete, METHODS.get, METHODS.post, METHODS.put];
    if (allowedMethods.indexOf(data.method.toUpperCase()) !== -1) {
        userRoutes._userRoutes[data.method.toLowerCase()](data, callback)
    } else {
        callback(405)
    }
}

// private user methods
userRoutes._userRoutes = {}

/**
 * @param data.phone string
 * @todo only allow for authenticated userRoutes
 */
userRoutes._userRoutes.get = function (data, callback) {
    console.log('users.get', data.queries.phone)
    const phone = helpers.validateString(data.queries.phone, 10, 10);

    if (phone) {
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
 * @TODO only allow for authenticated userRoutes
 */
userRoutes._userRoutes.post = function (data, callback) {
    const firstname = helpers.validateString(data.payload.firstname);
    const lastname = helpers.validateString(data.payload.lastname);
    const phone = helpers.validateString(data.payload.phone, 10, 10);
    const password = helpers.validateString(data.payload.password, 0);
    const tosAgreement = (typeof data.payload.tosAgreement === 'boolean' && !!data.payload.tosAgreement) ? true : false;

    if (firstname && lastname && phone && password && tosAgreement) {
        // ensure the user doesnt exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                // user doesnt exist
                // hash the password
                const hashedPassword = helpers.hash(password);

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
                callback(400, {
                    error: 'User exists'
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
 * @TODO only allow for authenticated userRoutes
 * @TODO only allow userRoutes to update their own data
 */
userRoutes._userRoutes.put = function (data, callback) {
    console.log('users.put data:', data)
    const firstname = helpers.validateString(data.payload.firstname);
    const lastname = helpers.validateString(data.payload.lastname);
    const phone = helpers.validateString(data.payload.phone, 10, 10);
    const password = helpers.validateString(data.payload.password, 0);

    if (phone && (firstname || lastname || password)) {
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
                    data.hashedPassword = helpers.hash(password);
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
        callback(400, {
            error: 'Missing required fields'
        })
    }
}

/**
 * @param data.queries.phone string
 * @TODO only allow for authenticated userRoutes
 * @TODO only allow userRoutes to update their own data
 */
userRoutes._userRoutes.delete = function (data, callback) {
    console.log('users.delete', data.queries);

    const phone = helpers.validateString(data.queries.phone, 10, 10);

    if (phone) {
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                _data.delete('users', phone, (err, data) => {
                    if (!err) {
                        callback(200)
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
        callback(400, {
            error: 'Bad request'
        })
    }
}

module.exports = userRoutes;