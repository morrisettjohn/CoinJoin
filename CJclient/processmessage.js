"use strict";
exports.__esModule = true;
var http_1 = require("http");
var consts = require("./constants");
var Message = /** @class */ (function () {
    function Message(mtype, mdata, mresolve, cachetimeout) {
        this.mtype = mtype;
        this.mdata = mdata;
        this.mresolve = mresolve;
        if (this.mresolve == "cache") {
            this.cachetimeout = cachetimeout;
        }
        else {
            this.cachetimeout = undefined;
        }
    }
    Message.prototype.setCacheTimeout = function (mlSecs) {
        if (this.mresolve = "cache") {
            this.cachetimeout = mlSecs;
        }
        else {
            throw new Error("can only apply a cachetimeout");
        }
    };
    Message.prototype.getCacheTimeout = function () {
        return this.cachetimeout;
    };
    Message.messagetypes = ["MSG", "ERR", "OPT", "JLS", "JDT", "NCE", "WTX", "STX", "TXD", "UND"];
    Message.resolvetypes = ["cache", "return", "print"];
    return Message;
}());
var isValidWTXData = function (data) {
    return true;
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
    var messages = [];
    while (recievedData.indexOf("\r\n\r\n") != -1) {
        var endIndex = recievedData.indexOf("\r\n\r\n");
        var messageType = recievedData.slice(0, 3);
        var messageData = recievedData.slice(3, endIndex);
        var message = new Message(messageType);
        recievedData = recievedData.slice(endIndex + 4);
        //handling message
        if (messageType == "MSG") {
            message.mdata = "SERVER MESSAGE: " + messageData;
            message.mresolve = "print";
        }
        //handling error message
        else if (messageType == "ERR") {
            message.mdata = "ERROR: " + messageData;
            message.mresolve = "print";
        }
        //handling get_options data
        else if (messageType == "OPT") {
            message.mdata = JSON.parse(messageData);
            message.mresolve = "print";
        }
        //handling get_joinlist data
        else if (messageType == "JLS") {
            var data = "";
            var joinlist = JSON.parse(messageData);
            for (var i = 0; i < joinlist.length; i++) {
                data += joinDataReadable(joinlist[i]);
            }
            message.mdata = data;
            message.mresolve = "print";
        }
        else if (messageType == "JDT") {
            message.mdata = joinDataReadable(JSON.parse(messageData));
            message.mresolve = "print";
        }
        else if (messageType == "NCE") {
            message.mdata = messageData;
            message.mresolve = "return";
        }
        //handling send_utxo data
        else if (messageType == "WTX") {
            var data = JSON.parse(messageData);
            if (isValidWTXData(data)) {
                message.mdata = data;
                message.mresolve = "return";
            }
            else {
                throw Error("Incomplete wtx");
            }
        }
        //handling signed_tx data
        else if (messageType == "STX") {
            var data = JSON.parse(messageData);
            if (isValidSTX(data)) {
                message.mdata = data["stx"];
                message.mresolve = "cache";
                message.setCacheTimeout(data["timeout"]);
            }
            else {
                throw new Error("incomplete stx");
            }
        }
        else if (messageType == "TXD") {
            message.mdata = messageData;
            message.mresolve = "return";
        }
        else {
            message.mtype = "UND";
            message.mdata = undefined;
        }
        messages.push(message);
    }
    return messages;
};
exports.processMessage = processMessage;
var joinDataReadable = function (join) {
    var state = "Inputs";
    if (join["state"] == consts.COLLECT_SIGS) {
        state = "Signatures";
    }
    var message = "Join ID: " + join["id"];
    message += "\n\tAsset Name: " + join["asset_name"];
    message += "\n\tBase amount: " + join["base_amount"];
    message += "\n\tTotal amount (with fees): " + join["total_amount"];
    message += "\n\tState: Collect " + state;
    message += "\n\tTotal " + state + " collected:  " + join["current_input_count"] + "/" + join["input_limit"] + "\r\n";
    return message;
};
var constructHeaderOptions = function (content) {
    var options = {
        host: "100.64.15.72",
        port: "65432",
        method: "POST",
        headers: {
            "Content-Length": Buffer.byteLength(content)
        }
    };
    return options;
};
exports.constructHeaderOptions = constructHeaderOptions;
var sendRecieve = function (sendData) {
    var returnDataString = JSON.stringify(sendData);
    var options = constructHeaderOptions(returnDataString);
    return new Promise(function (resolve, reject) {
        var cache = [];
        var timeout = undefined;
        var req = http_1.request(options, function (res) {
            res.on("data", function (d) {
                var recievedData = d.toString();
                var messages = processMessage(recievedData);
                messages.forEach(function (item) {
                    if (item.mresolve == "print") {
                        console.log(item.mdata);
                    }
                    else if (item.mresolve == "return") {
                        cache.push(item.mdata);
                        resolve(cache);
                    }
                    else if (item.mresolve == "cache") {
                        cache.push(item.mdata);
                        if (item.getCacheTimeout()) {
                            if (!timeout || timeout > item.getCacheTimeout()) {
                                timeout = item.getCacheTimeout();
                            }
                        }
                    }
                });
                if (timeout) {
                    setTimeout(function () { resolve(cache); }, timeout);
                }
            });
        });
        req.write(returnDataString);
        req.end();
    });
};
exports.sendRecieve = sendRecieve;
