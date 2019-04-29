/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Thu Jan 31 2019
 * 
 * Routes for orders
 * --------------------------------- */
const util = require('util');
const debug = util.debuglog('api_orders');

const _appHelpers = require('../helpers/app.helpers');
const _stripeHelpers = require('../helpers/stripe.helpers');
const _data = require('../helpers/data.helpers');
const verifyToken = require('./tokens').verify;

const METHODS = _appHelpers.METHODS;

const ORDER_STATUS = {
    recieved: 'ORDER_RECIEVED',
    started: 'ORDER_STARTED',
    expired: 'ORDER_EXPIRED',
    complete: 'ORDER_COMPLETE',
}

// container
const service = {};

// ---------------------------------------
// user methods - public gateway method
service.routes = (data, callback) => {
    debug('orders - method', data.method)
    if (Object.values(METHODS).indexOf(data.method.toLowerCase()) !== -1) {
        service._routes[data.method.toLowerCase()](data, callback)
    } else {
        callback(405, `the method ${data.method} is not allowed`)
    }
}


// private user methods
service._routes = {};

/**
 * @param data.order string
 * @param data.email string
 */
service._routes.post = function (data, callback) {
    const order = _appHelpers.validateArray(data.payload.order, 1);
    const email = _appHelpers.validateString(data.payload.email);

    debug('...order', order);
    debug('...email', email);

    if (order && email) {

        // get token from headers
        const tokenId = _appHelpers.validateTokenFromHeader(data.headers.token);
        debug('...tokenId', tokenId)

        if (tokenId) {
            // get the token and see if the email matches
            verifyToken(tokenId, email, (tokenIsValid) => {
                if (tokenIsValid) {
                    // validate email
                    // get the user
                    const hashedEmail = _appHelpers.filenameFromEmail(email);
                    _data.read('users', hashedEmail, (err, userData) => {
                        if (!err && userData) {
                            // construct the order
                            const orderData = {
                                for: `${userData.firstname} ${userData.lastname}`,
                                address: `${userData.street} ${userData.city}, ${userData.state} ${userData.zip}`,
                                order,
                                date: Date.now(),
                                status: ORDER_STATUS.recieved
                            }
                            const orderId = `${hashedEmail}-${Date.now()}`

                            _data.create('orders', orderId, orderData, err => {
                                if (!err) {
                                    // instantiate the orders array if necessary
                                    userData.orders = _appHelpers.validateArray(userData.orders, 1) || [];
                                    // and add the order to it
                                    userData.orders.push(orderId);
                                    // udate the user
                                    _data.update('users', hashedEmail, userData, err => {
                                        if (!err) {
                                            const stripeToken = data.payload.stripeToken;
                                            // const stripeToken = request.body.stripeToken; // Using Express
                                            debug('...stripeToken', stripeToken)
                                            _stripeHelpers.createCharge(12.99, 'usd', 'Order a pizza', stripeToken, err => {
                                                if (!err) {
                                                    callback(200, 'Order created')
                                                } else {
                                                    callback(500, {
                                                        error: `Could not create charge: ${err}`
                                                    })
                                                }
                                            });

                                        } else {
                                            callback(500, {
                                                error: `Could not update ${userData.email} wiith this order`
                                            })
                                        }
                                    })
                                } else {
                                    callback(500, {
                                        error: 'Could not complete order'
                                    })
                                }
                            })
                        } else {
                            callback(404, {
                                error: 'User not found'
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
            callback(403, 'Token missing or invalid')
        }
    } else {
        callback(400, {
            error: 'Missing required fields'
        })
    }
}

/**
 * @param data.query.email string
 */
service._routes.get = function (data, callback) {
    debug('orders.get', data.queries.email)
    const email = _appHelpers.validateString(data.queries.email);
    if (email) {
        // get and validate the token
        const tokenId = _appHelpers.validateTokenFromHeader(data.headers.token);
        debug('...tokenId', tokenId)

        if (tokenId) {
            // validate token
            _data.read('tokens', tokenId, (err, tokenData) => {
                if (!err && tokenData) {
                    if (tokenData.email === email) {
                        // get the order
                    } else {
                        callback(403, {
                            error: 'Not authorized'
                        })
                    }
                } else {
                    callback(403, {
                        error: 'Token not valid'
                    })
                }
            })
        } else {
            callback(403, {
                error: 'Token missing or not valid'
            })
        }
    } else {
        callback(400, {
            error: 'Missing required fields'
        })
    }
}


module.exports = service;