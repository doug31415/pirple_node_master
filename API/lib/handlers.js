/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * --------------------------------- */

// ---------------------------------------
// simple ping
const ping = (data, callback) => {
    callback(200)
}

// hello world homework
const hello = (data, callback) => {
    callback(200, {
        response: 'hello world'
    })
}

// 404 handler
const notFound = (data, callback) => {
    callback(404)
}

// all handlers
const handlers = {
    ping,
    hello,
    notFound,
}

// ---------------------------------------
module.exports = handlers