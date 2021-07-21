"use strict";
exports.__esModule = true;
var http_1 = require("http");
var isValidWTXData = function (data) {
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
    return true;
    /*XXX fix later
    if (!("signatures" in data && "transaction" in data)){
        return false
    }
    if (data["signatures"].length < 1 || data["transaction"].length != 1){
        return false
    }
    return true*/
};
//takes a message from the coinjoin server and processes it, using a 3 character prefix as a messagetype
var processMessage = function (recievedData) {
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
                var join = joinlist[i];
                printReadableJoinData(join);
            }
        }
        else if (messageType == "JDT") {
            console.log("recieved join data\r\n");
            printReadableJoinData(JSON.parse(messageData));
        }
        else if (messageType == "NCE") {
            return messageData;
        }
        //handling send_utxo data
        else if (messageType == "WTX") {
            console.log("recieved wiretx");
            var data = JSON.parse(messageData);
            if (isValidWTXData(data)) {
                return data;
            }
            else {
                return new Error("Incomplete wtx");
            }
        }
        //handling signed_tx data
        else if (messageType == "STX") {
            console.log("recieved full tx");
            var data = JSON.parse(messageData);
            if (isValidSTX(data)) {
                return data;
            }
            else {
                return new Error("incomplete stx");
            }
        }
        else {
            console.log("not a valid messagetype");
        }
    }
    return undefined;
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
var sendRecieve = function (sendData) {
    var returnDataString = JSON.stringify(sendData);
    var options = constructHeaderOptions(returnDataString);
    return new Promise(function (resolve, reject) {
        var req = http_1.request(options, function (res) {
            res.on("data", function (d) {
                var recievedData = d.toString();
                var data = processMessage(recievedData);
                if (data != undefined) {
                    resolve(data);
                }
            });
        });
        req.write(returnDataString);
        req.end();
    });
};
exports.sendRecieve = sendRecieve;
