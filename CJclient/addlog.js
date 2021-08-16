"use strict";
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
exports.get_join_tx_user_data = function (log_data, server_addr, join_tx_ID, user_addr) {
    var join_tx_user_data = exports.get_join_tx_data(log_data, server_addr, join_tx_ID)["users"];
    if (user_addr in join_tx_user_data) {
        return join_tx_user_data[user_addr];
    }
    else {
        console.log("user addr does not exist under join transaction, returning undefined");
        return undefined;
    }
};
exports.get_log_from_priv_key = function (log_data, server_addr, join_tx_ID, priv_key) {
    var key_type = avalancheutils_1.get_key_type(priv_key);
    var join_tx_data = exports.get_join_tx_data(log_data, server_addr, join_tx_ID);
    if (join_tx_data != undefined) {
        var network_data = avalancheutils_1.generate_xchain(join_tx_data["network_ID"]);
        var user_data_1 = join_tx_data["users"];
        if (key_type == 0) {
            var key_data = avalancheutils_1.generate_key_chain(network_data.xchain, priv_key);
            var addr = key_data.my_addr_strings[0];
            if (addr in user_data_1) {
                return user_data_1[addr];
            }
        }
        else if (key_type == 1) {
            var my_wallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(priv_key);
            my_wallet.getExternalAddressesX().forEach(function (addr) {
                if (addr in user_data_1) {
                    return user_data_1[addr];
                }
            });
        }
        console.log("no public key associated with this private key has a log here");
        return undefined;
    }
    else {
        return undefined;
    }
};
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
