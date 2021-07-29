"use strict";
exports.__esModule = true;
var fs = require("fs");
var log_info = function (message) {
    message = "at " + new Date().toLocaleString() + ":  " + message + "\n";
    fs.appendFile('log.txt', message, function (err) {
        if (err) {
            console.log("error writing to log.txt");
            throw err;
        }
        else {
            console.log("logged message");
        }
    });
};
exports.log_info = log_info;
