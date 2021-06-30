"use strict";
exports.__esModule = true;
exports.processMessage = void 0;
var issuetx_1 = require("./issuetx");
var sendsignature_1 = require("./sendsignature");
var processMessage = function (recievedData, joinid, pubaddr, privatekey) {
    while (recievedData.indexOf("\r\n\r\n") != -1) {
        var endIndex = recievedData.indexOf("\r\n\r\n");
        var messageType = recievedData.slice(0, 3);
        var messageData = recievedData.slice(3, endIndex);
        recievedData = recievedData.slice(endIndex + 4);
        if (messageType == "MSG") {
            console.log(messageData);
        }
        else if (messageType == "ERR") {
            console.log("ERROR: " + messageData);
        }
        else if (messageType == "STX") {
            console.log("recieved signedtx");
            issuetx_1.issuetx(JSON.parse(messageData));
        }
        else if (messageType == "WTX") {
            console.log("recieved wiretx");
            sendsignature_1.sendsignature(joinid, JSON.parse(messageData), pubaddr, privatekey);
        }
    }
};
exports.processMessage = processMessage;
