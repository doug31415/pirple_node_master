/**
 * Lib for storing and rotating logs
 */

// deps
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const util = require('util');
const debug = util.debuglog('api_logs');

const _appHelpers = require('./helpers/app.helpers');

var lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.logs/');

// append log to a file
// create that file if necessary
lib.append = (fileName, logData, callback) => {
    // open file for appending
    fs.open(`${lib.baseDir}${fileName}.log`, 'a', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            fs.appendFile(fileDescriptor, `${logData}\n`, err => {
                if (!err) {
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('Error closing log file')
                        }
                    })
                } else {
                    callback('Error appending log to log file')
                }
            })
        } else {
            callback('Could not open file for appending')
        }
    })
}

// list all the log files, optionally including compresed filed
lib.list = (includeCompressed, callback) => {
    fs.readdir(lib.baseDir, (err, fileList) => {
        if (!err && _appHelpers.validateArray(fileList, 1)) {
            // trim extensions from files
            const trimmedFileNames = [];
            fileList.forEach(fileName => {
                // add .log files
                if (fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log', ''));
                } else if (includeCompressed && fileName.indexOf('.gz.b64' > -1)) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''));
                }
            })
            callback(false, trimmedFileNames)
        } else {
            callback('Error: could not read a list of files')
        }
    })
}

// compress contents of a log file into the gz.bin64 log file
lib.compress = (logId, newFileId, callback) => {
    const source = `${logId}.log`;
    const destination = `${newFileId}.gz.b64`;

    fs.readFile(lib.baseDir + source, 'utf8', (err, inputString) => {
        if (!err && inputString) {
            // compress using gzip
            zlib.gzip(inputString, (err, buffer) => {
                if (!err && buffer) {
                    // send the data to the dest file
                    fs.open(lib.baseDir + destination, 'wx', (err, fileDescriptor) => {
                        if (!err + fileDescriptor) {
                            // write the file
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), err => {
                                if (!err) {
                                    fs.close(fileDescriptor, err => {
                                        if (!err) {
                                            callback(false)
                                        } else {
                                            callback(err)
                                        }
                                    })
                                } else {
                                    callback(err)
                                }
                            })
                        } else {
                            callback(err)
                        }
                    })
                } else {
                    callback(err)
                }
            })
        } else {
            callback(err)
        }
    })
}

// decompress contents of a gz.bin64 linto a string
lib.decompress = (logId, callback) => {
    const logFileName = logId + '.gz.b64';
    fs.readFile(logFileName, 'utf8', (err, logFileString) => {
        if (!err && logFileString) {
            // create a buffer
            const inputBuffer = Buffer.from(logFileString, 'base64')
            // decompress the file
            zlib.unzip(inputBuffer, (err, outputBuffer) => {
                if (!err && outputBuffer) {
                    const logStr = outputBuffer.toString()
                    callback(false, logStr)
                } else {
                    callback(err)
                }
            })
        } else {
            callback(err)
        }
    })
}

// truncate a log file
lib.truncate = (logId, callback) => {
    fs.truncate(`${lib.baseDir}${logId}.log`, 0, err => {
        if (!err) {
            callback(false)
        } else {
            callback(err)
        }
    })
}



module.exports = lib;