"use strict";
//runs the client for the coinjoin server.  Run 'node coinjoin' for info
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
var exitcj_1 = require("./exitcj");
var findmatchingjoins_1 = require("./findmatchingjoins");
var getjoindata_1 = require("./getjoindata");
var getoptiondata_1 = require("./getoptiondata");
var cjtxtypes_1 = require("./cjtxtypes");
var utils_1 = require("./utils");
var recordaddress_1 = require("./addr/recordaddress");
var getaddrdata_1 = require("./addr/getaddrdata");
var removeaddr_1 = require("./addr/removeaddr");
var signcjtx_1 = require("./signcjtx");
var JOIN = "join";
var SIGN = "sign";
var OPTIONS = "get_options";
var JOININFO = "join_info";
var SEARCH = "search";
var EXIT = "exit";
var INFO = "info";
var RECORD = "record";
var ADDRS = "addrs";
var REM_ADDR = "rem_addr";
var commands = [JOIN, SIGN, OPTIONS, JOININFO, SEARCH, EXIT, INFO, RECORD, ADDRS, REM_ADDR];
var STD_USAGE = "usage: node coinjoin";
var DESC = "description: ";
var HELP = "help";
//determine what command the user has input
var args = process.argv.slice(2);
var command = "";
if (args[0] == undefined) {
    command = INFO;
}
else {
    command = args[0].toString().toLocaleLowerCase();
}
args = args.slice(1);
var main = function () {
    if (command == JOIN) {
        cmd_start_cj_instance();
    }
    else if (command == SIGN) {
        cmd_sign_cj_tx();
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
    else if (command == RECORD) {
        cmd_record_address();
    }
    else if (command == ADDRS) {
        cmd_print_recorded_addrs();
    }
    else if (command == REM_ADDR) {
        cmd_remove_address();
    }
    else {
        console.log(command + " is not a valid command, here is a list of valid commands\n");
        cmd_help();
    }
};
//runs the help function
var cmd_help = function () {
    console.log("run 'node coinjoin (command) info' for more information\n");
    commands.forEach(function (item) {
        console.log("\t-" + item);
    });
    console.log("");
};
//records an address in the client's local addr folder
var cmd_record_address = function () {
    if (check_args_for_help(args)) {
        console.log(DESC + " locally stores a private key with a username for easy access");
        console.log(STD_USAGE + " " + RECORD + " (private key) (username)");
    }
    else {
        var addr_string = args[0];
        var username = args[1];
        recordaddress_1.record_address(addr_string, username);
    }
};
//removes an address from the client's local addr folder
var cmd_remove_address = function () {
    if (check_args_for_help(args)) {
        console.log(DESC + " removes one of the locally stored keys.  Use node coinjoin addrs to get a list of stored addresses");
        console.log(STD_USAGE + " " + REM_ADDR + " (username)");
    }
    else {
        var remove_item = args[0];
        removeaddr_1.remove_address(remove_item);
    }
};
//prints all recorded addresses stored in the client's local addr folder
var cmd_print_recorded_addrs = function () {
    if (check_args_for_help(args)) {
        console.log(DESC + " prints all stored private keys along with their usernames");
        console.log(STD_USAGE + " " + ADDRS);
    }
    else {
        var addrs = getaddrdata_1.get_address_data();
        for (var key in addrs) {
            console.log("\t-" + key + ": " + addrs[key]);
        }
    }
};
//run a complete coinjoin transaction
var cmd_start_cj_instance = function () { return __awaiter(void 0, void 0, void 0, function () {
    var ip, join_ID, private_key, dest_addr, input_amount;
    return __generator(this, function (_a) {
        if (check_args_for_help(args)) {
            console.log(DESC + " runs a complete transaction from start to finish, I.e. sends a valid input/output to the server and then signs");
            console.log(STD_USAGE + " " + JOIN + " (ip) (join_ID) (private_key) (dest_addr) [input_amount]");
        }
        else {
            ip = args[0];
            join_ID = parseInt(args[1]);
            private_key = args[2];
            dest_addr = args[3];
            input_amount = parseFloat(args[4]);
            private_key = convert_pk_username(private_key);
            cjtxtypes_1.full_cj_tx(join_ID, private_key, dest_addr, ip, input_amount);
        }
        return [2 /*return*/];
    });
}); };
//sign an existing input to an existing join
var cmd_sign_cj_tx = function () { return __awaiter(void 0, void 0, void 0, function () {
    var ip, join_ID, private_key;
    return __generator(this, function (_a) {
        if (check_args_for_help(args)) {
            console.log(DESC + " signs an existing transaction that the user is a part of");
            console.log(STD_USAGE + " " + SIGN + " (ip) (join_ID) (private_key)");
        }
        else {
            ip = args[0];
            join_ID = parseInt(args[1]);
            private_key = args[2];
            private_key = convert_pk_username(private_key);
            signcjtx_1.sign_cj_tx(join_ID, private_key, ip);
        }
        return [2 /*return*/];
    });
}); };
//gets the option data for a cj server
var cmd_get_option_data = function () {
    if (check_args_for_help(args)) {
        console.log(DESC + " gets the cj server's options for coinjoins, e.g. assetid/name, denominations, etc");
        console.log(STD_USAGE + " " + OPTIONS + " (ip)");
    }
    else {
        var ip = args[0];
        getoptiondata_1.get_option_data(ip);
    }
};
//gets the data for a specific join in the cj server
var cmd_print_join_data = function () { return __awaiter(void 0, void 0, void 0, function () {
    var ip, join_ID, join_data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!check_args_for_help(args)) return [3 /*break*/, 1];
                console.log(DESC + " gets the data for a specific join that is in the CJ server.");
                console.log(STD_USAGE + " " + JOININFO + " (ip) (join_id)");
                return [3 /*break*/, 3];
            case 1:
                ip = args[0];
                join_ID = parseInt(args[1]);
                return [4 /*yield*/, getjoindata_1.get_join_data(join_ID, ip)];
            case 2:
                join_data = (_a.sent());
                console.log(utils_1.join_data_readable(join_data));
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
//searches for joins in a cj server that match the user's specification
var cmd_find_matching_joins = function () { return __awaiter(void 0, void 0, void 0, function () {
    var ip, asset_ID, asset_amount, network_ID, min_users, max_users, join_list, join_data_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ip = args[0];
                asset_ID = args[1];
                asset_amount = parseFloat(args[2]);
                network_ID = parseInt(args[3]);
                min_users = parseInt(args[4]);
                max_users = parseInt(args[5]);
                if (!check_args_for_help(args)) return [3 /*break*/, 1];
                console.log(DESC + " runs the matchmaking service on the CJ server with given paramaters, and returns back applicable joins");
                console.log(STD_USAGE + " " + SEARCH + " (ip) (assetid | name) (targetamount) (networkID) [min_users] [max_users]");
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, findmatchingjoins_1.find_matching_joins(asset_ID, asset_amount, network_ID, ip, min_users, max_users)];
            case 2:
                join_list = (_a.sent());
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
//sends a request to a cj server to remove the user from a join
var cmd_exit_cj = function () {
    if (check_args_for_help(args)) {
        console.log(DESC + " exits a particular coinjoin by signing a nonce.");
        console.log("NOTE: if you have signed in to a join with multiple addresses (not recommended), you MUST enter your private key to determine which address you used.");
        console.log(STD_USAGE + " " + EXIT + " (ip) (join_ID) [priv_key]");
    }
    else {
        var ip = args[0];
        var join_ID = parseInt(args[1]);
        var private_key = args[2];
        private_key = convert_pk_username(private_key);
        exitcj_1.exit_cj(ip, join_ID, private_key);
    }
};
//check if the first paramater of a command is a call for help
var check_args_for_help = function (args) {
    if (args[0] == INFO || args[0] == HELP || args.length == 0 || args[0] == undefined) {
        return true;
    }
    return false;
};
//if a username for a private key is stored in the local addresses, convert the parameter to the private key
var convert_pk_username = function (private_key) {
    var address_data = getaddrdata_1.get_address_data();
    if (private_key in address_data) {
        return address_data[private_key];
    }
    else {
        return private_key;
    }
};
main();
