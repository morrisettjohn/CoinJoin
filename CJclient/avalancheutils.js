"use strict";
exports.__esModule = true;
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var utils_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/utils");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var bintools = avalanche_1.BinTools.getInstance();
var generatexchain = function (networkID) {
    var Ip = "";
    var port = 0;
    var protocol = "";
    if (networkID == 5) {
        Ip = "api.avax-test.network";
        port = 443;
        protocol = "https";
        avalanche_wallet_sdk_1.Network.setNetwork(avalanche_wallet_sdk_1.NetworkConstants.TestnetConfig);
    }
    else if (networkID == 1) {
        Ip = "api.avax.network";
        port = 443;
        protocol = "https";
        avalanche_wallet_sdk_1.Network.setNetwork(avalanche_wallet_sdk_1.NetworkConstants.MainnetConfig);
    }
    var xchainid = utils_1.Defaults.network[networkID].X.blockchainID;
    var xchainidBuf = bintools.cb58Decode(xchainid);
    var avax = new avalanche_1.Avalanche(Ip, port, protocol, networkID, xchainid);
    avax.setRequestConfig('withCredentials', true);
    var xchain = avax.XChain();
    return { "xchainid": xchainid, "xchain": xchain, xchainidBuf: xchainidBuf };
};
exports.generatexchain = generatexchain;
var generatekeychain = function (xchain, privatekey) {
    var xKeyChain = xchain.keyChain();
    var myKeyPair = xKeyChain.importKey(privatekey);
    var myAddressBuf = xchain.keyChain().getAddresses();
    var myAddressStrings = xchain.keyChain().getAddressStrings();
    return { "xKeyChain": xKeyChain, "myKeyPair": myKeyPair, "myAddressBuf": myAddressBuf, "myAddressStrings": myAddressStrings };
};
exports.generatekeychain = generatekeychain;
var getKeyType = function (key) {
    if (key.startsWith("PrivateKey-")) {
        return 0;
    }
    else if (key.split(" ").length == 24) {
        return 1;
    }
    else
        return -1;
};
exports.getKeyType = getKeyType;
