"use strict";
exports.__esModule = true;
var consts = require("./constants");
var join_data_readable = function (join) {
    var state = "inputs";
    if (join["state"] == consts.COLLECT_SIGS) {
        state = "signatures";
    }
    var message = "Join ID: " + join["ID"];
    message += "\n\tAsset Name: " + join["asset_name"];
    message += "\n\tAsset ID: " + join["asset_ID"];
    message += "\n\tNetwork ID: " + join["network_ID"];
    message += "\n\tBase amount: " + join["output_amount"];
    message += "\n\tTotal amount (with fees): " + join["input_amount"];
    message += "\n\tState: Collect " + state;
    message += "\n\tTotal " + state + " collected:  " + join["current_input_count"] + "/" + join["input_limit"];
    message += "\r\n";
    return message;
};
exports.join_data_readable = join_data_readable;
