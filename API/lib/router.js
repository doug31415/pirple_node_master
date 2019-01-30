/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * --------------------------------- */


const ping = (data, callback) => {
    callback(200)
}

const hello = (data, callback) => {
    callback(200, {
        response: 'hello world'
    })
}

const notFound = (data, callback) => {
    callback(404)
}

// define handlers
const handlers = {
    ping,
    hello,
    notFound,
}

// define a request router
const router = {
    'ping': handlers.ping,
    'hello': handlers.hello
}

module.exports = {
    handlers,
    router
}