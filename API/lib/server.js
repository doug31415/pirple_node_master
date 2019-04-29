/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * --------------------------------- */

// node deps
const config = require('../lib/config');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;
const url = require('url');

const util = require('util');
const debug = util.debuglog('api_server');

// application deps
const _router = require('./router');
const _handlers = require('./handlers');
const _appHelpers = require('./helpers/app.helpers');

// variables
const HTTP_PORT = config.httpPort;
const HTTPS_PORT = config.httpsPort;
const ENV_NAME = config.name;

const server = {};

server.init = () => {
    console.log(_appHelpers.LOG_COLORS.yellow, 'server init');
    // start the http server
    server.httpServer.listen(HTTP_PORT, () => console.log(_appHelpers.LOG_COLORS.blue, `http server is listening on port ${HTTP_PORT} in ${ENV_NAME} mode`));

    // start the https server
    server.httpsServer.listen(HTTPS_PORT, () => console.log(_appHelpers.LOG_COLORS.aqua, `https server is listening on port ${HTTPS_PORT} in ${ENV_NAME} mode`));
}

// instantiate the http server
server.httpServer = http.createServer(
    (req, res) => {
        server.unifiedServer(req, res)
    }
);

server.httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    certificate: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
}

// instantiate the https server
server.httpsServer = https.createServer(
    server.httpsServerOptions,
    (req, res) => {
        unifiedServer(req, res)
    }
);

server.unifiedServer = (req, res) => {
    // get url and parse it
    const parsedUrl = url.parse(req.url, true);

    // get path from url
    const path = parsedUrl.pathname;

    // trim extra slashes from path
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // get the HTTP method
    const method = req.method.toUpperCase();

    // get the query string
    const queryStringObj = parsedUrl.query;

    // get headers
    const headers = req.headers;

    // parse payload
    const decoder = new StringDecoder('utf-8');
    let payload = '';
    req.on('data', (data) => {
        payload += decoder.write(data);
    });

    req.on('end', () => {
        // cap buffer
        payload += decoder.end();

        // choose handler
        const routeHandler = _router[trimmedPath] || _handlers.notFound;

        // create data obj
        const data = {
            path: trimmedPath,
            queries: queryStringObj,
            method,
            headers,
            payload: _appHelpers.parseJsonStr(payload)
        };

        // route request
        routeHandler(data, (status, payload) => {
            const statusCode = (typeof status === 'number') ? status : 404;
            const responsePayload = (typeof payload === 'object') ? payload : {};
            const retVal = JSON.stringify(responsePayload);

            // return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(retVal);

            const logStr = `${method.toUpperCase()}: /${trimmedPath}: ${statusCode}`
            if (statusCode === 200) {
                debug(_appHelpers.LOG_COLORS.green, logStr)
            } else {
                debug(_appHelpers.LOG_COLORS.red, logStr)
            }

        })
    });
}

module.exports = server