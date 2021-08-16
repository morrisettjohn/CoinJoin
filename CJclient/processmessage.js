"use strict";
exports.__esModule = true;
var http_1 = require("http");
var utils_1 = require("./utils");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var Message = /** @class */ (function () {
    function Message(message_type, message_data, message_resolve, cache_timeout) {
        this.message_type = message_type;
        this.message_data = message_data;
        this.message_resolve = message_resolve;
        if (this.message_resolve == "cache") {
            this.cache_timeout = cache_timeout;
        }
        else {
            this.cache_timeout = undefined;
        }
    }
    Message.prototype.set_cache_timeout = function (mlsecs) {
        if (this.message_resolve = "cache") {
            this.cache_timeout = mlsecs;
        }
        else {
            throw new Error("can only apply a cache_timeout");
        }
    };
    Message.prototype.get_cache_timeout = function () {
        return this.cache_timeout;
    };
    Message.message_types = ["MSG", "ERR", "OPT", "JLS", "JDT", "NCE", "WTX", "STX", "TXD", "UND", "LOG"];
    Message.resolve_types = ["cache", "return", "print", "log"];
    return Message;
}());
var is_valid_join_data = function (data) {
    if ("ID" in data && "asset_name" in data && "asset_ID" in data && "network_ID" in data &&
        "state" in data && "input_limit" in data && "input_amount" in data && "output_amount" in data &&
        "fee_percent" in data && "join_tx_ID" in data && "fee_addr" in data && "last_accessed" in data) {
        return true;
    }
    return false;
};
var is_valid_wtx_data = function (data) {
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
var is_valid_stx_data = function (data) {
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
//takes a message from the coinjoin server and processes it, using a 3 character prefix as a message_type
var process_message = function (recieved_data) {
    var messages = [];
    while (recieved_data.indexOf("\r\n\r\n") != -1) {
        var end_index = recieved_data.indexOf("\r\n\r\n");
        var message_type = recieved_data.slice(0, 3);
        var message_data = recieved_data.slice(3, end_index);
        var message = new Message(message_type);
        recieved_data = recieved_data.slice(end_index + 4);
        //handling message
        if (message_type == "MSG") {
            message.message_data = "SERVER MESSAGE: " + message_data;
            message.message_resolve = "print";
        }
        //handling error message
        else if (message_type == "ERR") {
            message.message_data = "ERROR: " + message_data;
            message.message_resolve = "print";
        }
        //handling get_options data
        else if (message_type == "OPT") {
            message.message_data = JSON.parse(message_data);
            message.message_resolve = "print";
        }
        //handling get_join_list data
        else if (message_type == "JLS") {
            message.message_data = JSON.parse(message_data);
            message.message_resolve = "return";
        }
        else if (message_type == "JDT") {
            var data = JSON.parse(message_data);
            if (is_valid_join_data(data)) {
                message.message_data = JSON.parse(message_data);
                message.message_resolve = "return";
            }
            else {
                console.log("join data missing entries");
            }
        }
        else if (message_type == "NCE") {
            message.message_data = JSON.parse(message_data);
            message.message_resolve = "return";
        }
        //handling send_utxo data
        else if (message_type == "WTX") {
            var data = JSON.parse(message_data);
            if (is_valid_wtx_data(data)) {
                message.message_data = data;
                message.message_resolve = "return";
            }
            else {
                throw Error("Incomplete wtx");
            }
        }
        //handling signed_tx data
        else if (message_type == "STX") {
            var data = JSON.parse(message_data);
            if (is_valid_stx_data(data)) {
                message.message_data = data["stx"];
                message.message_resolve = "cache";
                message.set_cache_timeout(data["timeout"]);
            }
            else {
                throw new Error("incomplete stx");
            }
        }
        else if (message_type == "TXD") {
            message.message_data = message_data;
            message.message_resolve = "return";
        }
        else {
            message.message_type = "UND";
            message.message_data = undefined;
        }
        messages.push(message);
    }
    return messages;
};
exports.process_message = process_message;
var construct_header_options = function (content, ip) {
    var options = {
        host: utils_1.extract_host(ip),
        port: utils_1.extract_port(ip),
        method: "POST",
        headers: {
            "Content-Length": avalanche_1.Buffer.byteLength(content)
        }
    };
    return options;
};
exports.construct_header_options = construct_header_options;
var send_recieve = function (sendData, ip) {
    var return_data_string = JSON.stringify(sendData);
    var options = construct_header_options(return_data_string, ip);
    return new Promise(function (resolve, reject) {
        var cache = [];
        var timeout = undefined;
        var req = http_1.request(options, function (res) {
            res.on("data", function (d) {
                var recieved_data = d.toString();
                var messages = process_message(recieved_data);
                messages.forEach(function (item) {
                    if (item.message_resolve == "print") {
                        console.log(item.message_data);
                    }
                    else if (item.message_resolve == "return") {
                        cache.push(item.message_data);
                        resolve(cache);
                    }
                    else if (item.message_resolve == "cache") {
                        cache.push(item.message_data);
                        if (item.get_cache_timeout()) {
                            if (!timeout || timeout > item.get_cache_timeout()) {
                                timeout = item.get_cache_timeout();
                            }
                        }
                    }
                });
                if (timeout) {
                    setTimeout(function () { resolve(cache); }, timeout);
                }
            });
        });
        req.write(return_data_string);
        req.end();
    });
};
exports.send_recieve = send_recieve;
