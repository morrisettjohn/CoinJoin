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
var requestNonce = function (joinid, pubaddr, privatekey, networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, keyType, sendData, nonce, _a, _b, sig, keyData, mwallet;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                networkData = avalancheutils_1.generatexchain(networkID);
                keyType = avalancheutils_1.getKeyType(privatekey);
                sendData = {
                    "joinid": joinid,
                    "messagetype": consts.REQUEST_TO_JOIN,
                    "pubaddr": pubaddr
                };
                _b = (_a = avalanche_1.Buffer).from;
                return [4 /*yield*/, processmessage_1.sendRecieve(sendData)];
            case 1:
                nonce = _b.apply(_a, [(_c.sent())[0]]);
                sig = undefined;
                if (!(keyType == 0)) return [3 /*break*/, 2];
                keyData = avalancheutils_1.generatekeychain(networkData.xchain, privatekey);
                sig = keyData.myKeyPair.sign(nonce);
                return [3 /*break*/, 4];
            case 2:
                if (!(keyType == 1)) return [3 /*break*/, 4];
                mwallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(privatekey);
                return [4 /*yield*/, mwallet.resetHdIndices()];
            case 3:
                _c.sent();
                sig = mwallet.getSigFromUTX(nonce, mwallet.getExternalAddressesX().indexOf(pubaddr));
                _c.label = 4;
            case 4: return [2 /*return*/, sig];
        }
    });
}); };
exports.requestNonce = requestNonce;
