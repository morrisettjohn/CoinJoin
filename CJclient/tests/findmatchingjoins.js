"use strict";
exports.__esModule = true;
var findmatchingjoins_1 = require("../findmatchingjoins");
//usage:  node test.js *assetid/name* *amount* *networkID* *min_users?* *max_users?*
var args = process.argv.slice(2);
var min_users = undefined;
var max_users = undefined;
if (args.length > 3) {
    min_users = parseInt(args[3]);
}
if (args.length > 4) {
    max_users = parseInt(args[4]);
}
var main = function () {
    if (args[0] == "help") {
        console.log("usage: node txtest.js *assetid/name* *targetamount* *networkID* *min_users?* *max_users?*");
    }
    else {
        findmatchingjoins_1.findMatchingJoins(args[0], parseInt(args[1]), parseInt(args[2]), min_users, max_users);
    }
};
main();
