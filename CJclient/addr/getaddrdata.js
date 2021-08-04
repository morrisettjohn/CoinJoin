"use strict";
exports.__esModule = true;
var fs = require("fs");
var get_address_data = function () {
    try {
        var data = JSON.parse(fs.readFileSync('./addresses.txt', 'utf8'));
        if (data == "") {
            return {};
        }
        return data;
    }
    catch (err) {
        return {};
    }
};
exports.get_address_data = get_address_data;
