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
var utils_1 = require("../utils");
var JOIN = "join";
var OPTIONS = "get_options";
var JOININFO = "join_info";
var SEARCH = "search";
var EXIT = "exit";
var INFO = "info";
var commands = [JOIN, OPTIONS, JOININFO, SEARCH, EXIT, INFO];
var STD_USAGE = "usage: node coinjoin";
var DESC = "description: ";
var args = process.argv.slice(2);
var command = args[0];
args = args.slice(1);
var main = function () {
    if (command == JOIN) {
        cmd_start_cj_instance();
    }
    else if (command == OPTIONS) {
        cmd_get_option_data();
    }
    else if (command == JOININFO) {
        cmd_print_join_data();
    }
    else if (command == SEARCH) {
        cmd_find_matching_joins();
    }
    else if (command == EXIT) {
        cmd_exit_cj();
    }
    else if (command == INFO) {
        cmd_help();
    }
    else {
        console.log(command + " is not a valid command, here is a list of valid commands\n");
        cmd_help();
    }
};
var cmd_help = function () {
    console.log("run 'node coinjoin *command* help' for more information");
    commands.forEach(function (item) {
        console.log("\t" + item);
    });
};
var cmd_start_cj_instance = function () { return __awaiter(void 0, void 0, void 0, function () {
    var join_ID, private_key, dest_addr, input_amount;
    return __generator(this, function (_a) {
        join_ID = parseInt(args[0]);
        private_key = args[1];
        dest_addr = args[2];
        input_amount = parseFloat(args[3]);
        if (args[0] == "help") {
            console.log(DESC + " runs a complete transaction from start to finish, I.e. sends a valid input/output to the server and then signs\n");
            console.log(STD_USAGE + " '" + JOIN + " (join_ID) (private_key) (dest_addr) [input_amount]'");
        }
        else {
            cjtxtypes_1.full_cj_tx(join_ID, private_key, dest_addr, input_amount);
        }
        return [2 /*return*/];
    });
}); };
var cmd_get_option_data = function () {
    if (args[0] == "help") {
        console.log(DESC + " gets the cj server's options for coinjoins, e.g. assetid/name, denominations, etc\n");
        console.log(STD_USAGE + " " + OPTIONS);
    }
    else {
        getoptiondata_1.get_option_data();
    }
};
var cmd_print_join_data = function () { return __awaiter(void 0, void 0, void 0, function () {
    var join_data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(args[0] == "help")) return [3 /*break*/, 1];
                console.log(DESC + " gets the data for a specific join that is in the CJ server.\n");
                console.log(STD_USAGE + " " + JOININFO + " (join_id)");
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, getjoindata_1.get_join_data(parseInt(args[0]))];
            case 2:
                join_data = (_a.sent());
                console.log(utils_1.join_data_readable(join_data));
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
var cmd_find_matching_joins = function () { return __awaiter(void 0, void 0, void 0, function () {
    var min_users, max_users, join_list, join_data_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                min_users = undefined;
                max_users = undefined;
                if (args.length > 3) {
                    min_users = parseInt(args[3]);
                }
                if (args.length > 4) {
                    max_users = parseInt(args[4]);
                }
                if (!(args[0] == "help")) return [3 /*break*/, 1];
                console.log(DESC + " runs the matchmaking service on the CJ server with given paramaters, and returns back applicable joins\n");
                console.log(STD_USAGE + " " + SEARCH + " (assetid | name) (targetamount) (networkID) [min_users] [max_users]");
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, findmatchingjoins_1.find_matching_joins(args[0], parseInt(args[1]), parseInt(args[2]), min_users, max_users)];
            case 2:
                join_list = (_a.sent());
                console.log(join_list);
                join_data_1 = "";
                join_list.forEach(function (item) {
                    join_data_1 += utils_1.join_data_readable(item);
                });
                console.log(join_data_1);
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
var cmd_exit_cj = function () {
    var join_ID = parseInt(args[0]);
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
        console.log(STD_USAGE + " " + EXIT + " (join_ID) (networkID) (testkeypair / privatekey) (pubkey)");
    }
    else {
        exitcj_1.exit_cj(join_ID, networkID, publickey, privatekey);
    }
};
main();
