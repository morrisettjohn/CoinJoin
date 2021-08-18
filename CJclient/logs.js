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
var fs = require("fs");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var avalancheutils_1 = require("./avalancheutils");
var WEEK_MLS = 604800000;
var OLD_LOG_TIME = WEEK_MLS;
var log_path = "/home/jcm/Documents/test/CoinJoin/CJclient/joinlogs/logs.json";
exports.get_server_join_txs = function (log_data, server_addr) {
    if (server_addr in log_data) {
        return log_data[server_addr];
    }
    else {
        console.log("server addr does not exist in logs, returning undefined");
        return undefined;
    }
};
exports.get_join_tx_data = function (log_data, server_addr, join_tx_ID) {
    var join_txs = exports.get_server_join_txs(log_data, server_addr);
    if (join_tx_ID in join_txs) {
        return join_txs[join_tx_ID];
    }
    else {
        console.log("join tx does not exist under server addr, returning undefined");
        return undefined;
    }
};
exports.get_log_from_pub_key = function (log_data, server_addr, join_tx_ID, user_addr) {
    var join_tx_user_data = exports.get_join_tx_data(log_data, server_addr, join_tx_ID)["users"];
    if (user_addr in join_tx_user_data) {
        return join_tx_user_data[user_addr];
    }
    else {
        console.log("user addr does not exist under join transaction, returning undefined");
        return undefined;
    }
};
exports.get_pub_addr_from_tx = function (log_data, server_addr, join_tx_ID, priv_key) { return __awaiter(void 0, void 0, void 0, function () {
    var key_type, join_tx_data, network_data, user_data, key_data, my_wallet, wallet_addrs, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                key_type = avalancheutils_1.get_key_type(priv_key);
                join_tx_data = exports.get_join_tx_data(log_data, server_addr, join_tx_ID);
                if (!(join_tx_data != undefined)) return [3 /*break*/, 4];
                network_data = avalancheutils_1.generate_xchain(join_tx_data["network_ID"]);
                user_data = join_tx_data["users"];
                if (!(key_type == 0)) return [3 /*break*/, 1];
                key_data = avalancheutils_1.generate_key_chain(network_data.xchain, priv_key);
                return [2 /*return*/, key_data.my_addr_strings[0]];
            case 1:
                if (!(key_type == 1)) return [3 /*break*/, 3];
                my_wallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(priv_key);
                return [4 /*yield*/, my_wallet.resetHdIndices()];
            case 2:
                _a.sent();
                wallet_addrs = my_wallet.getExternalAddressesX();
                for (i = 0; i < wallet_addrs.length; i++) {
                    if (wallet_addrs[i] in user_data)
                        return [2 /*return*/, wallet_addrs[i]];
                }
                _a.label = 3;
            case 3:
                console.log("no public key associated with this private key has a log here");
                return [3 /*break*/, 5];
            case 4: return [2 /*return*/, undefined];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.get_log_from_priv_key = function (log_data, server_addr, join_tx_ID, priv_key) { return __awaiter(void 0, void 0, void 0, function () {
    var pub_addr;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.get_pub_addr_from_tx(log_data, server_addr, join_tx_ID, priv_key)];
            case 1:
                pub_addr = _a.sent();
                if (pub_addr != undefined) {
                    return [2 /*return*/, exports.get_log_from_pub_key(log_data, server_addr, join_tx_ID, pub_addr)];
                }
                else {
                    return [2 /*return*/, undefined];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.add_log = function (server_addr, join_tx_ID, join_tx_data, user_addr, user_data) {
    console.log("logging data");
    try {
        var log_data = exports.get_all_logs();
        if (!(server_addr in log_data)) {
            log_data[server_addr] = {};
        }
        if (!(join_tx_ID in log_data[server_addr])) {
            log_data[server_addr][join_tx_ID] = join_tx_data;
        }
        log_data[server_addr][join_tx_ID]["users"][user_addr] = user_data;
        fs.writeFileSync(log_path, JSON.stringify(log_data));
        console.log("added log to file");
    }
    catch (err) {
        console.log(err);
        console.log("error recording log");
    }
};
exports.get_all_logs = function () {
    try {
        var data = JSON.parse(fs.readFileSync(log_path, 'utf8'));
        if (data == "") {
            return {};
        }
        else {
            return data;
        }
    }
    catch (err) {
        console.log("couldn't find");
        return {};
    }
};
