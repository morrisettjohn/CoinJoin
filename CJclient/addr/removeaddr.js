"use strict";
exports.__esModule = true;
var fs = require("fs");
var getaddrdata_1 = require("./getaddrdata");
var remove_address = function (remove_item) {
    try {
        var username = undefined;
        var addr = undefined;
        var data = getaddrdata_1.get_address_data();
        if (remove_item in data) {
            username = remove_item;
            addr = data[username];
            delete data[remove_item];
        }
        else {
            console.log("username/private key does not exist, did not remove");
            return;
        }
        console.log("removed address " + addr + " under username " + username);
        fs.writeFileSync('./addresses.txt', JSON.stringify(data));
    }
    catch (err) {
        console.log("error writing to address file");
    }
};
exports.remove_address = remove_address;
