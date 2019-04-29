const querystring = require('querystring');
const https = require('https');
const _appHelpers = require('./app.helpers')
const _config = require('../config')

const util = require('util');
const debug = util.debuglog('api_twilio');


const twilio = {};

// send sms
twilio.sendTwilioSMS = (phone, mssg, callback) => {
    phone = _appHelpers.validateString(phone, 10, 10);
    mssg = _appHelpers.validateString(mssg, 1, 1600);

    if (phone && mssg) {
        // configure request payload
        const payloadConfig = {
            From: _config.twilio.fromPhone,
            To: `+1${phone}`,
            Body: mssg
        };

        // stringify payload and configure request
        const payload = querystring.stringify(payloadConfig);

        // create request
        const requestConfig = {
            protocol: 'https:',
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${_config.twilio.accountSid}/Messages.json`,
            auth: `${_config.twilio.accountSid}:${_config.twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payload)
            }
        }

        // instantiate request obj
        const req = https.request(requestConfig, res => {
            // get status of sent request
            const status = res.statusCode;
            // handle response
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                callback(`ERROR: got this: ${status}`)
            }
        });

        // bind to an error event so it doesnt get thrown
        req.on('error', err => {
            callback(e)
        })

        // add payload
        req.write(payload)

        // send and end request
        req.end();


    } else {
        callback('Missing or invalid parameters')
    }
}

module.exports = twilio;