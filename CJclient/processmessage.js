"use strict";
exports.__esModule = true;
exports.sendRecieve = exports.constructHeaderOptions = exports.processMessage = void 0;
var issuetx_1 = require("./issuetx");
var http_1 = require("http");
//takes a message from the coinjoin server and processes it, using a 3 character prefix as a messagetype
var processMessage = function (recievedData, joinid, pubaddr, privatekey, input, output) {
    while (recievedData.indexOf("\r\n\r\n") != -1) {
        var endIndex = recievedData.indexOf("\r\n\r\n");
        var messageType = recievedData.slice(0, 3);
        var messageData = recievedData.slice(3, endIndex);
        recievedData = recievedData.slice(endIndex + 4);
        //handling message
        if (messageType == "MSG") {
            console.log(messageData);
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
            //sendsignature(joinid, JSON.parse(messageData), pubaddr, privatekey, input, output)
        }
        //handling signed_tx data
        else if (messageType == "STX") {
            console.log("recieved signedtx");
            issuetx_1.issuetx(JSON.parse(messageData));
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
var sendRecieve = function (sendData, joinid, pubaddr, privatekey, input, output) {
    var returnDataString = JSON.stringify(sendData);
    var options = constructHeaderOptions(returnDataString);
    var req = http_1.request(options, function (res) {
        res.on("data", function (d) {
            var recievedData = d.toString();
            processMessage(recievedData, joinid, pubaddr, privatekey, input, output);
        });
    });
    req.write(returnDataString);
    req.end();
};
exports.sendRecieve = sendRecieve;
