"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var exitcj_1 = require("../exitcj");
var testaddrs_1 = require("./testaddrs");
var findmatchingjoins_1 = require("../findmatchingjoins");
var getjoindata_1 = require("../getjoindata");
var getoptiondata_1 = require("../getoptiondata");
var cjtxtypes_1 = require("../cjtxtypes");
var utils_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/utils");
var RUN_COMPLETE_TX = "run_complete_tx";
var OPTIONS = "getoptions";
var JOINDATA = "joindata";
var FINDJOINS = "findjoins";
var EXIT = "exitcj";
var HELP = "help";
var STDUSAGE = "usage: node CJclient.js";
var DESC = "description: ";
var commands = [RUN_COMPLETE_TX, OPTIONS, JOINDATA, FINDJOINS, EXIT, HELP];
var args = process.argv.slice(2);
var command = args[0];
args = args.slice(1);
var main = function () {
    if (command == RUN_COMPLETE_TX) {
        cmdstartCJInstance();
    }
    else if (command == OPTIONS) {
        cmdGetOptionData();
    }
    else if (command == JOINDATA) {
        cmdGetJoinData();
    }
    else if (command == FINDJOINS) {
        cmdFindMatchingJoin();
    }
    else if (command == EXIT) {
        cmdExitCJ();
    }
    else if (command == HELP) {
        cmdHelp();
    }
    else {
        console.log(command + " is not a valid command, here is a list of valid commands\n");
        cmdHelp();
    }
};
var cmdHelp = function () {
    console.log("run 'node CJclient.js *command* help' for more information");
    commands.forEach(function (item) {
        console.log("\t" + item);
    });
};
var cmdstartCJInstance = function () { return __awaiter(void 0, void 0, void 0, function () {
    var networkID, avaxAssetID, assetID, inputamount, outputamount, joinid, fromaddr, toaddr, networkid;
    return __generator(this, function (_a) {
        networkID = 5;
        avaxAssetID = utils_1.Defaults.network[networkID].X.avaxAssetID;
        assetID = avaxAssetID;
        inputamount = 1.15;
        outputamount = 1;
        joinid = parseInt(args[0]);
        fromaddr = undefined;
        toaddr = undefined;
        if (args[1] in testaddrs_1.tests) {
            fromaddr = testaddrs_1.tests[args[1]];
        }
        else if (args[1] in testaddrs_1.wtests) {
            fromaddr = testaddrs_1.wtests[args[1]];
        }
        if (args[2] in testaddrs_1.tests) {
            toaddr = testaddrs_1.tests[args[2]];
        }
        else if (args[2] in testaddrs_1.wtests) {
            toaddr = testaddrs_1.tests[args[2]];
        }
        networkid = parseInt(args[3]);
        if (args.length > 4) {
            inputamount = parseFloat(args[4]);
        }
        if (args.length > 5) {
            outputamount = parseFloat(args[5]);
        }
        if (args.length > 6) {
            assetID = args[6];
        }
        if (args[0] == "help") {
            console.log(DESC + " runs a complete transaction from start to finish, I.e. sends a valid input/output to the server and then signs\n");
            console.log(STDUSAGE + " '" + RUN_COMPLETE_TX + " *joinid* *fromaddr* *toaddr* *networkid* *inputamount?* *outputamount?* *assetID?*'");
        }
        else {
            cjtxtypes_1.fullcjtx(joinid, assetID, inputamount, outputamount, toaddr[0], fromaddr[0], fromaddr[1], networkid);
        }
        return [2 /*return*/];
    });
}); };
var cmdGetOptionData = function () {
    if (args[0] == "help") {
        console.log(DESC + " gets the cj server's options for coinjoins, e.g. assetid/name, denominations, etc\n");
        console.log(STDUSAGE + " " + OPTIONS);
    }
    else {
        getoptiondata_1.getoptiondata();
    }
};
var cmdGetJoinData = function () {
    if (args[0] == "help") {
        console.log(DESC + " gets the data for a specific join that is in the CJ server.\n");
        console.log(STDUSAGE + " " + JOINDATA + " *joinid*");
    }
    else {
        getjoindata_1.getjoindata(parseInt(args[0]));
    }
};
var cmdFindMatchingJoin = function () {
    var min_users = undefined;
    var max_users = undefined;
    if (args.length > 3) {
        min_users = parseInt(args[3]);
    }
    if (args.length > 4) {
        max_users = parseInt(args[4]);
    }
    if (args[0] == "help") {
        console.log(DESC + " runs the matchmaking service on the CJ server with given paramaters, and returns back applicable joins\n");
        console.log(STDUSAGE + " " + FINDJOINS + " *assetid/name* *targetamount* *networkID* *min_users?* *max_users?*");
    }
    else {
        findmatchingjoins_1.findMatchingJoins(args[0], parseInt(args[1]), parseInt(args[2]), min_users, max_users);
    }
};
var cmdExitCJ = function () {
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
        console.log(DESC + " exits a particular coinjoin by signing a nonce\n");
        console.log(STDUSAGE + " " + EXIT + " *joinid* *networkID* *testkeypair / privatekey* *pubkey*");
    }
    else {
        exitcj_1.exitcj(joinid, networkID, publickey, privatekey);
    }
};
main();
