"use strict";
exports.__esModule = true;
exports.sendRecieve = exports.constructHeaderOptions = exports.processMessage = void 0;
var issuetx_1 = require("./issuetx");
var sendsignature_1 = require("./sendsignature");
var http_1 = require("http");
var isValidWTX = function (data) {
    if (!("inputs" in data && "outputs" in data)) {
        return false;
    }
    if (data["inputs"].length < 1 || data["outputs"].length < 1) {
        return false;
    }
    data["inputs"].forEach(function (item) {
        if (!("pubaddr" in item && "inputbuf" in item)) {
            return false;
        }
    });
    data["inputs"].forEach(function (item) {
        if (!("outputbuf" in item)) {
            return false;
        }
    });
    return true;
};
var isValidSTX = function (data) {
    if (!("signatures" in data && "transaction" in data)) {
        return false;
    }
    if (data["signatures"].length < 1 || data["transaction"].length != 1) {
        return false;
    }
    return true;
};
//takes a message from the coinjoin server and processes it, using a 3 character prefix as a messagetype
var processMessage = function (recievedData, networkID, joinid, pubaddr, privatekey, input, output) {
    while (recievedData.indexOf("\r\n\r\n") != -1) {
        var endIndex = recievedData.indexOf("\r\n\r\n");
        var messageType = recievedData.slice(0, 3);
        var messageData = recievedData.slice(3, endIndex);
        recievedData = recievedData.slice(endIndex + 4);
        //handling message
        if (messageType == "MSG") {
            console.log("SERVER MESSAGE: " + messageData);
        }
        //handling error message
        else if (messageType == "ERR") {
            console.log("ERROR: " + messageData);
        }
        //handling get_options data
        else if (messageType == "OPT") {
            console.log("recieved optiondata");
            console.log(JSON.parse(messageData));
        }
        //handling get_joinlist data
        else if (messageType == "JLS") {
            console.log("recieved list of compatible joins\r\n");
            var joinlist = JSON.parse(messageData);
            for (var i = 0; i < joinlist.length; i++) {
                var join_1 = joinlist[i];
                printReadableJoinData(join_1);
            }
        }
        else if (messageType == "JDT") {
            console.log("recieved join data\r\n");
            printReadableJoinData(JSON.parse(messageData));
        }
        //handling send_utxo data
        else if (messageType == "WTX") {
            console.log("recieved wiretx");
            var data = JSON.parse(messageData);
            if (isValidWTX(data)) {
                sendsignature_1.sendsignature(joinid, data, pubaddr, privatekey, networkID, input, output);
            }
            else {
                return new Error("Incomplete wtx");
            }
        }
        //handling signed_tx data
        else if (messageType == "STX") {
            console.log("messagedata");
            console.log(messageData);
            issuetx_1.issuetx(JSON.parse(messageData), networkID);
        }
        else {
            console.log("not a valid messagetype");
        }
    }
};
exports.processMessage = processMessage;
var constructHeaderOptions = function (content) {
    var options = {
        host: "192.168.129.105",
        port: "65432",
        method: "POST",
        headers: {
            "Content-Length": Buffer.byteLength(content)
        }
    };
    return options;
};
exports.constructHeaderOptions = constructHeaderOptions;
var printReadableJoinData = function (join) {
    var state = "Inputs";
    if (join["state"] == 4) {
        state = "Signatures";
    }
    console.log("Join ID: " + join["id"]);
    console.log("\tState: Collect " + state);
    console.log("\tTotal amount (with fees): " + join["total_amount"]);
    console.log("\tBase amount: " + join["base_amount"]);
    console.log("\tTotal " + state + " collected:  " + join["current_input_count"] + "/" + join["input_limit"] + "\r\n");
};
var sendRecieve = function (sendData, networkID, joinid, pubaddr, privatekey, input, output) {
    var returnDataString = JSON.stringify(sendData);
    var options = constructHeaderOptions(returnDataString);
    var req = http_1.request(options, function (res) {
        res.on("data", function (d) {
            var recievedData = d.toString();
            processMessage(recievedData, networkID, joinid, pubaddr, privatekey, input, output);
        });
    });
    req.write(returnDataString);
    req.end();
};
exports.sendRecieve = sendRecieve;
