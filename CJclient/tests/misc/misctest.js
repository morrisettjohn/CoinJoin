"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs");
var addlog_1 = require("../../addlog");
var n = function () { return __awaiter(void 0, void 0, void 0, function () {
    var b;
    return __generator(this, function (_a) {
        b = new Date();
        setTimeout(function () {
            var v = new Date();
            v.setTime(b.getTime());
            console.log(v);
            console.log(b);
        }, 1000);
        return [2 /*return*/];
    });
}); };
var b = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        data = fs.readFileSync("./test.json", "utf8");
        console.log(JSON.parse(data));
        return [2 /*return*/];
    });
}); };
var c = function () { return __awaiter(void 0, void 0, void 0, function () {
    var v, key;
    return __generator(this, function (_a) {
        v = { "hi": 1, "bi": 2, "tri": 3 };
        for (key in v) {
            console.log(key);
        }
        return [2 /*return*/];
    });
}); };
var a = function () { return __awaiter(void 0, void 0, void 0, function () {
    var z;
    return __generator(this, function (_a) {
        z = addlog_1.get_all_logs();
        console.log(z);
        console.log(addlog_1.get_server_join_txs(z, "X-fuji13gpgdlfsz6nysrjh4trhuf2hj240aguah8rxwq"));
        console.log(addlog_1.get_join_tx_data(z, "X-fuji13gpgdlfsz6nysrjh4trhuf2hj240aguah8rxwq", "1628879411470"));
        return [2 /*return*/];
    });
}); };
var v = function () {
    var p = {};
    p["1"]["2"] = 3;
    console.log(p);
};
a();
