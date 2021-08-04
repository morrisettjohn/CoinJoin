"use strict";
exports.__esModule = true;
var fs = require("fs");
var getaddrdata_1 = require("./getaddrdata");
var record_address = function (addr, username) {
    try {
        var data = getaddrdata_1.get_address_data();
        if (username in data) {
            console.log(username + " is already a username, please use a different one");
            return;
        }
        data[username] = addr;
        console.log("recorded address " + addr + " under username " + username);
        fs.writeFileSync('./addresses.txt', JSON.stringify(data));
    }
    catch (err) {
        console.log("error writing to address file");
    }
};
exports.record_address = record_address;
