"use strict";
//signs an existing join that the user is a part of
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
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var getjoindata_1 = require("./getjoindata");
var logs_1 = require("./logs");
var sendsignature_1 = require("./sendsignature");
var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var requestwtx_1 = require("./requestwtx");
var bintools = avalanche_1.BinTools.getInstance();
var sign_cj_tx = function (join_ID, private_key, ip) { return __awaiter(void 0, void 0, void 0, function () {
    var join_params, network_ID, join_tx_ID, server_addr, log_data, pub_addr, pub_addr_log, wtx, input, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getjoindata_1.get_join_data(join_ID, ip)];
            case 1:
                join_params = _a.sent();
                network_ID = join_params["network_ID"];
                join_tx_ID = join_params["join_tx_ID"];
                server_addr = join_params["fee_addr"];
                log_data = logs_1.get_all_logs();
                return [4 /*yield*/, logs_1.get_pub_addr_from_tx(log_data, server_addr, join_tx_ID, private_key)];
            case 2:
                pub_addr = _a.sent();
                pub_addr_log = logs_1.get_log_from_pub_key(log_data, server_addr, join_tx_ID, pub_addr);
                return [4 /*yield*/, requestwtx_1.request_wtx(join_ID, private_key, pub_addr, network_ID, ip)];
            case 3:
                wtx = (_a.sent())[0];
                input = new avm_1.TransferableInput();
                output = new avm_1.TransferableOutput();
                input.fromBuffer(bintools.cb58Decode(pub_addr_log["input"]));
                output.fromBuffer(bintools.cb58Decode(pub_addr_log["output"]));
                //send signature to coinjoin
                return [4 /*yield*/, sendsignature_1.send_signature(join_ID, wtx, pub_addr, private_key, network_ID, ip, input, output)];
            case 4:
                //send signature to coinjoin
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.sign_cj_tx = sign_cj_tx;
