"use strict";
exports.__esModule = true;
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var utils_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/utils");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var bintools = avalanche_1.BinTools.getInstance();
var generate_xchain = function (network_ID) {
    var Ip = "";
    var port = 0;
    var protocol = "";
    if (network_ID == 5) {
        Ip = "api.avax-test.network";
        port = 443;
        protocol = "https";
        avalanche_wallet_sdk_1.Network.setNetwork(avalanche_wallet_sdk_1.NetworkConstants.TestnetConfig);
    }
    else if (network_ID == 1) {
        Ip = "api.avax.network";
        port = 443;
        protocol = "https";
        avalanche_wallet_sdk_1.Network.setNetwork(avalanche_wallet_sdk_1.NetworkConstants.MainnetConfig);
    }
    var xchain_ID = utils_1.Defaults.network[network_ID].X.blockchainID;
    var xchain_ID_buf = bintools.cb58Decode(xchain_ID);
    var avax = new avalanche_1.Avalanche(Ip, port, protocol, network_ID, xchain_ID);
    avax.setRequestConfig('withCredentials', true);
    var xchain = avax.XChain();
    return { "xchain_ID": xchain_ID, "xchain": xchain, xchain_ID_buf: xchain_ID_buf };
};
exports.generate_xchain = generate_xchain;
var generate_key_chain = function (xchain, privatekey) {
    var x_key_chain = xchain.keyChain();
    var my_key_pair = x_key_chain.importKey(privatekey);
    var my_addr_strings = [my_key_pair.getAddressString()];
    var my_addr_buf = [my_key_pair.getAddress()];
    return { "x_key_chain": x_key_chain, "my_key_pair": my_key_pair, "my_addr_buf": my_addr_buf, "my_addr_strings": my_addr_strings };
};
exports.generate_key_chain = generate_key_chain;
var get_key_type = function (key) {
    if (key.startsWith("PrivateKey-")) {
        return 0;
    }
    else if (key.split(" ").length == 24) {
        return 1;
    }
    else
        return -1;
};
exports.get_key_type = get_key_type;
