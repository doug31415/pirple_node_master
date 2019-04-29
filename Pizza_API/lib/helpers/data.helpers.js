/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Wed Jan 30 2019
 * 
 * library for editing and storing data
 * --------------------------------- */

const fs = require('fs');
const path = require('path');

const util = require('util');
const debug = util.debuglog('api_data');

const _appHelpers = require('./app.helpers');


// container
const lib = {};

// base directory
lib.baseDir = path.join(__dirname, '/../../.data/');

// helper to get normalized file path
lib.getFilePath = function (dir, fileName) {
    return lib.baseDir + dir + '/' + fileName + '.json'
}

// helper to save and close data
lib.saveAndClose = function (fileDescriptor, stringData, callback) {
    fs.writeFile(fileDescriptor, stringData, err => {
        if (!err) {
            // close the file
            fs.close(fileDescriptor, err => {
                if (!err) {
                    callback(false)
                } else {
                    callback('Error closing file', err)

                }
            })
        } else {
            callback('Error writing file: ' + err)
        }
    })
}

// create data
lib.create = function (dir, fileName, data, callback) {
    fs.open(lib.getFilePath(dir, fileName), 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // data to string
            const stringData = JSON.stringify(data);

            // write to file then close
            lib.saveAndClose(fileDescriptor, stringData, callback);
        } else {
            callback('Cannot create file. Does it already exist? ' + err)
        }
    })
}

// read data from a file
lib.read = function (dir, fileName, callback) {
    fs.readFile(lib.getFilePath(dir, fileName), 'utf-8', (err, data) => {
        if (!err && data) {
            const parsed = _appHelpers.parseJsonStr(data)
            callback(false, parsed)
        } else {
            callback(err, data)
        }
    })
}

// update data to a file
lib.update = function (dir, fileName, data, callback) {
    fs.open(lib.getFilePath(dir, fileName), 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // data to string
            const stringData = JSON.stringify(data);

            // truncate file
            fs.ftruncate(fileDescriptor, err => {
                if (!err) {
                    // write to file then close
                    lib.saveAndClose(fileDescriptor, stringData, callback);
                } else {
                    callback('Error truncating file', err)
                }
            })


        } else {
            callback(`Cannot update ${dir}/${fileName} with ${data}. Does it exist?`, err)
        }
    })
}

// delete a file
lib.delete = function (dir, fileName, callback) {
    fs.unlink(lib.getFilePath(dir, fileName), (err) => {
        if (!err) {
            callback(false)
        } else {
            callback(err)
        }
    })
}

// list all the files in a directory
lib.list = (dir, callback) => {
    fs.readdir(`${lib.baseDir}${dir}/`, (err, data) => {
        debug('list', data);
        if (!err && _appHelpers.validateArray(data, 1)) {
            const trimmedFileNames = [];
            data.forEach(datum => {
                trimmedFileNames.push(datum.replace('.json', ''))
            });
            callback(false, trimmedFileNames)
        } else {
            callback(err, data)
        }
    })
}

module.exports = lib;