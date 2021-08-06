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
var processmessage_1 = require("./processmessage");
var consts = require("./constants");
var requestnonce_1 = require("./requestnonce");
var avalancheutils_1 = require("./avalancheutils");
var getjoindata_1 = require("./getjoindata");
var avalancheutils_2 = require("./avalancheutils");
var avalancheutils_3 = require("./avalancheutils");
var exit_cj = function (join_ID, private_key) { return __awaiter(void 0, void 0, void 0, function () {
    var join_params, network_ID, key_type, user_list, network_data, pub_addr, key_data, ticket, send_data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getjoindata_1.get_join_data(join_ID)];
            case 1:
                join_params = _a.sent();
                network_ID = join_params["network_ID"];
                key_type = avalancheutils_1.get_key_type(private_key);
                return [4 /*yield*/, get_user_list(join_ID)];
            case 2:
                user_list = _a.sent();
                network_data = avalancheutils_2.generate_xchain(network_ID);
                pub_addr = undefined;
                if (key_type == 0) {
                    key_data = avalancheutils_3.generate_key_chain(network_data.xchain, private_key);
                    pub_addr = key_data.my_addr_strings[0];
                }
                return [4 /*yield*/, requestnonce_1.request_nonce(join_ID, pub_addr, private_key, network_ID)];
            case 3:
                ticket = _a.sent();
                send_data = {
                    "join_ID": join_ID,
                    "message_type": consts.EXIT,
                    "pub_addr": pub_addr,
                    "ticket": ticket
                };
                console.log("sending data to coinjoin server now");
                return [4 /*yield*/, processmessage_1.send_recieve(send_data)];
            case 4:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.exit_cj = exit_cj;
