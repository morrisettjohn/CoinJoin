"use strict";
exports.__esModule = true;
var exitcj_1 = require("../exitcj");
var testaddrs_1 = require("./testaddrs");
//usage:  node test.js *assetid/name* *amount* *networkID* *min_users?* *max_users?*
var args = process.argv.slice(2);
var main = function () {
    var joinid = parseInt(args[0]);
    var networkID = parseInt(args[1]);
    var publickey = undefined;
    var privatekey = undefined;
    if (args[2] in testaddrs_1.tests) {
        privatekey = testaddrs_1.tests[args[2]][1];
        publickey = testaddrs_1.tests[args[2]][0];
    }
    else if (args[2] in testaddrs_1.wtests) {
        privatekey = testaddrs_1.wtests[args[2]][1];
        if (args.length < 4) {
            throw new Error("not enough args");
        }
        publickey = args[3];
    }
    else {
        privatekey = args[2];
        publickey = args[3];
    }
    if (args[0] == "help") {
        console.log("usage: node exitccj.js *joinid* *networkID* *testkeypair / privatekey* *pubkey*");
    }
    else {
        exitcj_1.exitcj(joinid, networkID, publickey, privatekey);
    }
};
main();
