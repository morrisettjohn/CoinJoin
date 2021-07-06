"use strict";
exports.__esModule = true;
var getjoindata_1 = require("../getjoindata");
//usage:  node test.js *assetid/name* *amount* *min_users?* *max_users?*
var args = process.argv.slice(2);
var main = function () {
    getjoindata_1.getjoindata(parseInt(args[0]));
};
main();
