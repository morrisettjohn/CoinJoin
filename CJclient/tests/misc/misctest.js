"use strict";
exports.__esModule = true;
var generatenonce_1 = require("../../generatenonce");
var log_info = function (message) {
};
var n = function () {
    var z = [];
    for (var i = 0; i < 1000; i++) {
        z.push(generatenonce_1.generate_nonce(3));
    }
    console.log(z.toString());
};
n();
