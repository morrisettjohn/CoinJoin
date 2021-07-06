"use strict";
exports.__esModule = true;
var selectjoin_1 = require("../selectjoin");
//usage:  node test.js *assetid/name* *amount* *min_users?* *max_users?*
var args = process.argv.slice(2);
var main = function () {
    selectjoin_1.selectjoin(args[0], parseInt(args[1]), parseInt(args[2]), parseInt(args[3]));
};
main();
