/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * --------------------------------- */

// node deps
const config = require('./config');
const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// application deps
const logger = require('./lib/logger');
const router = require('./lib/router');

// variables
const HTTP_PORT = config.httpPort;
const HTTPS_PORT = config.httpsPort;
const ENV_NAME = config.name;

// instantiate the http server
const httpServer = http.createServer(

    (req, res) => {
        unifiedServer(req, res)
    }
);

// httpServer listens on 3000
httpServer.listen(HTTP_PORT, () => console.log(`http server is listening on port ${HTTP_PORT} in ${ENV_NAME} mode`));

const httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    certificate: fs.readFileSync('./https/cert.pem')
}

// instantiate the https server
const httpsServer = https.createServer(
    httpsServerOptions,
    (req, res) => {
        unifiedServer(req, res)
    }
);

// httpsServer listens
httpsServer.listen(HTTPS_PORT, () => console.log(`https server is listening on port ${HTTPS_PORT} in ${ENV_NAME} mode`));

const unifiedServer = (req, res) => {
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
        const handler = router.handlers[trimmedPath] || router.handlers.notFound;

        // create data obj
        const data = {
            path: trimmedPath,
            queries: queryStringObj,
            method,
            headers,
            payload
        };

        // route request
        handler(data, (status, payload) => {
            const statusCode = (typeof status === 'number') ? status : 404;
            const responsePayload = (typeof payload === 'object') ? payload : {};
            const retVal = JSON.stringify(responsePayload);

            // return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(retVal);
        })
    });
}