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
var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalancheutils_1 = require("./avalancheutils");
var constants_1 = require("./constants");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var avalanche_wallet_sdk_2 = require("@avalabs/avalanche-wallet-sdk");
//setting up the xchain object
var bintools = avalanche_1.BinTools.getInstance();
var sendutxodata = function (joinid, assetid, inputamount, outputamount, destinationaddr, pubaddr, privatekey, networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, xchain, assetidBuf, fee, targetInpAmountFormatted, targetInpAmountFormatBN, targetInpAmountWithFee, targetOutAmountFormatted, targetOutAmountFormatBN, keyType, id, signedTx, keyData, myAddresses, myAddressBuf, utxoset, balance, unsignedTx, mwallet, from, to, change, walletutxos, unsignedTx, status;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                networkData = avalancheutils_1.generatexchain(networkID);
                xchain = networkData.xchain;
                assetidBuf = bintools.cb58Decode(assetid);
                fee = xchain.getDefaultTxFee();
                targetInpAmountFormatted = inputamount * constants_1.BNSCALE;
                targetInpAmountFormatBN = new avalanche_1.BN(targetInpAmountFormatted);
                targetInpAmountWithFee = targetInpAmountFormatBN.add(fee);
                targetOutAmountFormatted = outputamount * constants_1.BNSCALE;
                targetOutAmountFormatBN = new avalanche_1.BN(targetOutAmountFormatted);
                keyType = avalancheutils_1.getKeyType(privatekey);
                id = "";
                signedTx = new avm_1.Tx();
                if (!(keyType == 0)) return [3 /*break*/, 5];
                keyData = avalancheutils_1.generatekeychain(networkData.xchain, privatekey);
                myAddresses = keyData.myAddressStrings;
                myAddressBuf = keyData.myAddressBuf;
                return [4 /*yield*/, xchain.getUTXOs(pubaddr)];
            case 1:
                utxoset = (_a.sent()).utxos;
                balance = utxoset.getBalance(myAddressBuf, assetid);
                if (!(balance.toNumber() >= targetInpAmountWithFee.toNumber())) return [3 /*break*/, 3];
                return [4 /*yield*/, xchain.buildBaseTx(utxoset, targetInpAmountFormatBN, assetid, myAddresses, myAddresses, myAddresses)];
            case 2:
                unsignedTx = _a.sent();
                signedTx = unsignedTx.sign(keyData.xKeyChain);
                return [3 /*break*/, 4];
            case 3:
                console.log("insufficient funds");
                throw Error; //XXX fix this later
            case 4: return [3 /*break*/, 11];
            case 5:
                if (!(keyType == 1)) return [3 /*break*/, 11];
                console.log(avalanche_wallet_sdk_1.Network);
                console.log("yo");
                mwallet = avalanche_wallet_sdk_2.MnemonicWallet.fromMnemonic(privatekey);
                return [4 /*yield*/, mwallet.resetHdIndices()];
            case 6:
                _a.sent();
                return [4 /*yield*/, mwallet.updateUtxosX()];
            case 7:
                _a.sent();
                from = mwallet.getAllAddressesX();
                to = mwallet.getAddressX();
                change = mwallet.getChangeAddressX();
                walletutxos = mwallet.utxosX;
                if (!(mwallet.getBalanceX()[assetid].unlocked.toNumber() >= targetInpAmountWithFee.toNumber())) return [3 /*break*/, 10];
                return [4 /*yield*/, xchain.buildBaseTx(walletutxos, targetInpAmountFormatBN, assetid, [to], from, [change])];
            case 8:
                unsignedTx = _a.sent();
                return [4 /*yield*/, mwallet.signX(unsignedTx)];
            case 9:
                signedTx = _a.sent();
                return [3 /*break*/, 11];
            case 10: throw Error("insufficient funds in wallet");
            case 11: return [4 /*yield*/, xchain.issueTx(signedTx)];
            case 12:
                id = _a.sent();
                console.log("issued");
                status = "";
                _a.label = 13;
            case 13:
                if (!(status != "Accepted" && status != "Rejected")) return [3 /*break*/, 15];
                return [4 /*yield*/, xchain.getTxStatus(id)];
            case 14:
                status = _a.sent();
                return [3 /*break*/, 13];
            case 15:
                if (status === "Rejected") {
                    throw Error("rejected, not submitting to coinjoin");
                }
                console.log("Accepted");
                return [2 /*return*/];
        }
    });
}); };
exports.sendutxodata = sendutxodata;
