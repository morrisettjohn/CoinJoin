"use strict";
exports.__esModule = true;
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var avalancheutils_1 = require("../avalancheutils");
var bintools = avalanche_1.BinTools.getInstance();
var x = avalancheutils_1.generatexchain(5);
var testaddr = "X-fuji1xam3qzr4t752khj5kpg6ezz9nm42e4ffsyylzz";
var converty = "8iZHCsqMx3LS97bLKNrWufviwkNf2TXKD";
var words1 = x.xchain.parseAddress(testaddr);
var y = bintools.cb58Decode(converty);
console.log("hi\r\n\r\n");
/*let teststring = ""
words.forEach(item => {
    teststring += ALPHABET[item]
})
console.log(teststring)

x.xchain.parseAddress()*/
//64GoAhMjv7ri2bBLLEaQNJMEDVN8XGBbP
//7LfaaqM8qxGW5nN5xCHqfMyfLABro7H8g
