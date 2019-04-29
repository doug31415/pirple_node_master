/**
 * worker related functions
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const url = require('url');

const util = require('util');
const debug = util.debuglog('api_workers');

const _logs = require('./logs');
const _data = require('./data');
const _appHelpers = require('./helpers/app.helpers');
const _twilioHelpers = require('./helpers/twillio.helpers');

const workers = {};

workers.init = () => {
    console.log(_appHelpers.LOG_COLORS.yellow, 'workers init');

    // execute all checks
    workers.gatherAllChecks();

    // loop through the checks
    workers.loop();

    // compress logs
    workers.rotateLogs();

    // call the compression loop so logs will be compressed later
    workers.logRotationLoop();
};

workers.gatherAllChecks = () => {
    // lookup all checks
    _data.list('checks', (err, checks) => {
        // debug('...err', err);
        // debug('...checks', checks);
        if (!err && _appHelpers.validateArray(checks, 1)) {
            checks.forEach(check => {
                _data.read('checks', check, (err, checkDataOrig) => {
                    // debug('...check', check);
                    // debug('...err', err);
                    // debug('...checkDataOrig', checkDataOrig);

                    if (!err && checkDataOrig) {
                        // pass checkDataOrig to the check validator
                        workers.validateCheckData(checkDataOrig);
                    } else {
                        debug('error reading check', err);
                    }
                });
            });
        } else {
            debug('err, no checks to process', err);
        }
    });
};

/**
 * check that the data is valid
 */
workers.validateCheckData = checkData => {
    checkData = typeof checkData === 'object' && !!checkData ? checkData : false;
    checkData.id = _appHelpers.validateString(checkData.id, 20, 20);
    checkData.userPhone = _appHelpers.validateString(checkData.userPhone, 10, 10);

    checkData.protocol = (checkData.protocol.toLowerCase() === _appHelpers.PROTOCOLS.http || checkData.protocol.toLowerCase() === _appHelpers.PROTOCOLS.https) ?
        _appHelpers.validateString(checkData.protocol, 4, 5) : false;

    checkData.url = _appHelpers.validateString(checkData.url, 1, 200);
    checkData.method = ['post', 'get', 'put', 'delete'].indexOf(checkData.method.toLowerCase()) > -1 && _appHelpers.validateString(checkData.method, 3, 6)

    checkData.successCodes = _appHelpers.validateArray(checkData.successCodes, 1);
    checkData.timeoutSeconds = _appHelpers.validateNumber(checkData.timeoutSeconds, 1, 5);

    // set any missing keys if workers havent seen this before
    checkData.state = _appHelpers.validateString(checkData.state, 2, 4) && Object.values(_appHelpers.CHECK_STATE).indexOf(checkData.state) > -1 ?
        checkData.state :
        _appHelpers.CHECK_STATE.up;

    checkData.lastChecked = _appHelpers.validateNumber(checkData.lastChecked, 1)


    // if everything passes, return the check data
    if (checkData.id && checkData.userPhone && checkData.protocol && checkData.url && checkData.method && checkData.successCodes && checkData.timeoutSeconds) {
        workers.performCheck(checkData)
    } else {
        debug('this check isnt valid', checkData)
    }
};

// do the actual check, record outcome and send to next step
workers.performCheck = checkData => {
    // prepare initial check outcome
    const checkOutcome = {
        error: false,
        responseCode: false
    }

    // mark that the oucome hasnt been sent yet
    let outcomeSent = false;

    // figure out hostName and path
    const parsedUrl = url.parse(`${checkData.protocol}://${checkData.url}`, true);
    const hostname = parsedUrl.hostname
    const path = parsedUrl.path

    // debug('...parsedUrl', parsedUrl);
    // debug('...hostname', hostname);
    // debug('...path', path); // not pathname because path includes querystrings

    // create request
    const requestConfig = {
        protocol: `${checkData.protocol}:`,
        hostname,
        method: checkData.method.toUpperCase(),
        path,
        timeout: checkData.timeoutSeconds * 1000
    };

    // instantiate request obj
    const module = checkData.protocol === _appHelpers.PROTOCOLS.http ? http : https;

    const req = module.request(requestConfig, res => {
        // update the checkOutcome and send the data to the next step
        checkOutcome.responseCode = res.statusCode;

        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    // bind to error event so it doesnt get thrown
    req.on('error', err => {
        checkOutcome.error = {
            error: true,
            value: err
        };

        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    })

    // bind to timeout event so it doesnt get thrown
    req.on('timeout', err => {
        checkOutcome.error = {
            error: true,
            value: err
        };

        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    })

    // send and end request
    req.end();
}

// process the check outcome and update checkData as needed
// trigger alert to user if necessary
// dont alert if check hasnt been processed before (ie went from down to up)
workers.processCheckOutcome = (checkData, checkOutcome) => {
    // is check up or down?
    const state = !checkOutcome.error &&
        checkOutcome.responseCode &&
        checkData.successCodes.indexOf(checkOutcome.responseCode) > -1 ?
        _appHelpers.CHECK_STATE.up :
        _appHelpers.CHECK_STATE.down;

    // alert needed
    const alertNeeded = checkData.lastChecked && checkData.state !== state;

    // now
    const now = Date.now();

    // update checkData
    const newCheckData = {
        ...checkData,
        state,
        lastChecked: now
    }

    // log outcome, plus time
    workers.log(checkData, checkOutcome, state, alertNeeded, now)

    _data.update('checks', newCheckData.id, newCheckData, err => {
        if (!err) {
            // send the check data to alert
            if (alertNeeded) {
                workers.createStatusChangeAlert(newCheckData);
            } else {
                debug('LOG: status unchanged, no alert needed')
            }
        } else {
            debug('ERROR: cant save at least one check', err)
        }

    })
}

// alert the user to a change in their check status
workers.createStatusChangeAlert = checkData => {
    const mssg = `ALERT: your check for ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} is now ${checkData.state}`;

    _twilioHelpers.sendTwilioSMS(checkData.userPhone, mssg, err => {
        if (!err) {
            debug('SUCCESS: user was alerted via SMS: ', mssg)
        } else {
            debug('ERROR: unable to send alert: ', mssg)
        }
    })
}

// timer to execute the process once per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

// timer to execte log rotation once a day
workers.logRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
};

workers.log = (originalCheckData, checkOutcome, state, alertNeeded, time) => {
    const logData = {
        originalCheckData,
        checkOutcome,
        state,
        alertNeeded,
        time
    }

    // make a string
    const logStr = JSON.stringify(logData);

    // log name
    const logFileName = originalCheckData.id;

    // write logs
    _logs.append(logFileName, logStr, err => {
        if (!err) {
            debug('logging success', logFileName)
        } else {
            console.error('logging failed', err)
        }
    });
}

// compress logs and start with new logs
workers.rotateLogs = () => {
    // list all the noncompressed log files
    _logs.list(false, (err, logsArr) => {
        if (!err && _appHelpers.validateArray(logsArr, 1)) {
            logsArr.forEach(log => {
                // compress data to different file
                const logId = log.replace('.log', '');
                const newFileId = `${logId}-${Date.now()}`;
                _logs.compress(logId, newFileId, err => {
                    if (!err) {
                        _logs.truncate(logId, err => {
                            if (!err) {
                                debug('Success truncating log file')
                            } else {
                                console.error('Error: cant truncate log file')
                            }
                        })
                    } else {
                        console.error('Error: cant compress a file: ', err)
                    }
                })
            })
        } else {
            console.error('Error: no logs to compress')
        }
    })

}
module.exports = workers;