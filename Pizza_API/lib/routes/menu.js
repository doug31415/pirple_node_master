/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Thu Jan 31 2019
 * 
 * Routes for menuService
 * --------------------------------- */
const util = require('util');
const debug = util.debuglog('api_menu');

const _appHelpers = require('../helpers/app.helpers');
const _data = require('../helpers/data.helpers');
const verifyToken = require('./tokens').verify;

const METHODS = _appHelpers.METHODS;

const menu = {
    pizza: [{
            id: 1,
            category: 'pizza',
            item: 'pizza',
            sauce: 'red',
            crust: 'reg',
            size: '16',
            extras: [],
            price: 12.99
        },
        {
            id: 2,
            category: 'pizza',
            item: 'pizza',
            sauce: 'white',
            crust: 'reg',
            size: '16',
            extras: [],
            price: 12.99
        }
    ],
    toppings: [{
            id: 3,
            category: 'topping',
            item: 'mushrooms',
            price: 0.99
        },
        {
            id: 4,
            category: 'topping',
            item: 'onions',
            price: 0.99
        },
        {
            id: 5,
            category: 'topping',
            item: 'sausage',
            price: 1.99
        },
        {
            id: 6,
            category: 'topping',
            item: 'green pepper',
            price: 0.99
        }
    ]
}


// container
const menuService = {};

// ---------------------------------------
// user methods - public gateway method
menuService.routes = (data, callback) => {
    debug('user method', data.method)
    if (Object.values(METHODS).indexOf(data.method.toLowerCase()) !== -1) {
        menuService._routes[data.method.toLowerCase()](data, callback)
    } else {
        callback(405, `the method ${data.method} is not allowed`)
    }
}

// private user methods
menuService._routes = {}


menuService._routes.get = function (data, callback) {
    debug('menu.get')

    // get token from headers
    const tokenId = _appHelpers.validateTokenFromHeader(data.headers.token);
    debug('...tokenId', tokenId)

    _data.read('tokens', tokenId, (err, tokenData) => {
        if (!err && tokenData) {
            // get the menu
            callback(200, menu)
        } else {
            callback(403, {
                error: 'Token not valid'
            })
        }
    })
}


module.exports = menuService;