"use strict";
exports.__esModule = true;
var avalanche_1 = require("avalanche");
var utils_1 = require("avalanche/dist/utils");
var bintools = avalanche_1.BinTools.getInstance();
var generatexchain = function (networkID) {
    var Ip = "";
    var port = 0;
    var protocol = "";
    if (networkID == 5) {
        Ip = "api.avax-test.network";
        port = 443;
        protocol = "https";
    }
    else if (networkID == 1) {
        Ip = "api.avax.network";
        port = 443;
        protocol = "https";
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
