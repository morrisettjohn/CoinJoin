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
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var processmessage_1 = require("./processmessage");
var consts = require("./constants");
var avalancheutils_1 = require("./avalancheutils");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var bintools = avalanche_1.BinTools.getInstance();
var request_nonce = function (join_ID, pub_addr, private_key, network_ID) { return __awaiter(void 0, void 0, void 0, function () {
    var network_data, key_type, send_data, recieved_nonce, my_nonce, full_nonce, full_nonce_buf, sig, key_data, my_wallet;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                network_data = avalancheutils_1.generate_xchain(network_ID);
                key_type = avalancheutils_1.get_key_type(private_key);
                send_data = {
                    "join_ID": join_ID,
                    "message_type": consts.REQUEST_TO_JOIN,
                    "pub_addr": pub_addr
                };
                return [4 /*yield*/, processmessage_1.send_recieve(send_data)];
            case 1:
                recieved_nonce = (_a.sent())[0];
                my_nonce = generate_nonce();
                full_nonce = recieved_nonce + my_nonce;
                full_nonce_buf = new avalanche_1.Buffer(full_nonce);
                sig = undefined;
                if (!(key_type == 0)) return [3 /*break*/, 2];
                key_data = avalancheutils_1.generate_key_chain(network_data.xchain, private_key);
                sig = key_data.my_key_pair.sign(full_nonce_buf);
                return [3 /*break*/, 4];
            case 2:
                if (!(key_type == 1)) return [3 /*break*/, 4];
                my_wallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(private_key);
                return [4 /*yield*/, my_wallet.resetHdIndices()];
            case 3:
                _a.sent();
                sig = my_wallet.getSigFromUTX(full_nonce_buf, my_wallet.getExternalAddressesX().indexOf(pub_addr));
                _a.label = 4;
            case 4: return [2 /*return*/, [full_nonce, sig]];
        }
    });
}); };
exports.request_nonce = request_nonce;
var ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var generate_nonce = function () {
    var return_nonce = "";
    for (var i = 0; i < 5; i++) {
        return_nonce += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return return_nonce;
};
