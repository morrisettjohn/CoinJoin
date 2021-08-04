"use strict";
exports.__esModule = true;
var fs = require("fs");
var log_info = function (message) {
    var data = undefined;
    try {
        data = fs.readFileSync('dmclean.txt', 'utf8');
        console.log(data == "");
    }
    catch (err) {
        console.log(err);
    }
    fs.writeFile('nuts.txt', message, function (err) {
        if (err) {
            console.log("error writing to log.txt");
            throw err;
        }
        else {
            console.log("logged message");
        }
    });
};
log_info(JSON.stringify({ "1": 1, "2": 2 }));
