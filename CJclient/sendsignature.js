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
var common_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common");
var processmessage_1 = require("./processmessage");
var crypto_1 = require("crypto");
var avalancheutils_1 = require("./avalancheutils");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var consts = require("./constants");
var loginfo_1 = require("./loginfo");
var bintools = avalanche_1.BinTools.getInstance();
var sendsignature = function (joinid, data, pubaddr, privatekey, networkID, myInput, myOutput) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, keyType, txbuff, unsignedTx, inputs, outputs, msg, sigbuf, sig, keyData, utxoset, myUtxos, mwallet, sigString, sendData, signedTx, log_data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                networkData = avalancheutils_1.generatexchain(networkID);
                keyType = avalancheutils_1.getKeyType(privatekey);
                txbuff = avalanche_1.Buffer.from(data);
                unsignedTx = new avm_1.UnsignedTx();
                unsignedTx.fromBuffer(txbuff);
                inputs = unsignedTx.getTransaction().getIns();
                outputs = unsignedTx.getTransaction().getOuts();
                msg = avalanche_1.Buffer.from(crypto_1.createHash("sha256").update(txbuff).digest());
                sigbuf = undefined;
                sig = new common_1.Signature();
                if (!(keyType == 0)) return [3 /*break*/, 2];
                keyData = avalancheutils_1.generatekeychain(networkData.xchain, privatekey);
                return [4 /*yield*/, networkData.xchain.getUTXOs(pubaddr)];
            case 1:
                utxoset = (_a.sent()).utxos;
                myUtxos = utxoset.getAllUTXOs();
                runSecurityChecks(inputs, outputs, myInput, myOutput, myUtxos);
                sigbuf = keyData.myKeyPair.sign(msg);
                sig.fromBuffer(sigbuf);
                return [3 /*break*/, 5];
            case 2:
                if (!(keyType == 1)) return [3 /*break*/, 5];
                mwallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(privatekey);
                return [4 /*yield*/, mwallet.resetHdIndices()];
            case 3:
                _a.sent();
                return [4 /*yield*/, mwallet.updateUtxosX()];
            case 4:
                _a.sent();
                runSecurityChecks(inputs, outputs, myInput, myOutput, mwallet.utxosX.getAllUTXOs());
                sigString = mwallet.getSigFromUTX(msg, mwallet.getAllAddressesX().indexOf(pubaddr));
                sig.fromBuffer(sigString);
                _a.label = 5;
            case 5:
                sendData = {
                    "joinid": joinid,
                    "messagetype": consts.COLLECT_SIGS,
                    "signature": sig.toBuffer(),
                    "pubaddr": pubaddr
                };
                return [4 /*yield*/, processmessage_1.sendRecieve(sendData)];
            case 6:
                signedTx = _a.sent();
                log_data = "successfully sent signature to CJ of id " + joinid + " using address " + pubaddr + ".";
                console.log(log_data);
                loginfo_1.log_info(log_data);
                return [2 /*return*/, signedTx];
        }
    });
}); };
exports.sendsignature = sendsignature;
var checkInputs = function (inputs, myInput, myUtxos) {
    var hasInput = false;
    var unwantedUTXOcount = 0;
    for (var i = 0; i < inputs.length; i++) {
        var checkItem = inputs[i];
        if (checkItem.getTxID().equals(myInput.getTxID()) && checkItem.getOutputIdx().equals(myInput.getOutputIdx())) {
            hasInput = true;
        }
        else {
            for (var j = 0; j < myUtxos.length; j++) {
                var testutxo = myUtxos[j];
                if (checkItem.getTxID().equals(testutxo.getTxID()) && checkItem.getOutputIdx().equals(testutxo.getOutputIdx())) {
                    unwantedUTXOcount++;
                    break;
                }
            }
        }
    }
    if (!hasInput) {
        throw Error("Your input is not recorded in the transaction, server or coinjoin participants may be malicious");
    }
    if (unwantedUTXOcount > 0) {
        throw Error(unwantedUTXOcount + " other utxo(s) that you own were recorded in the tx.  Server or cj participants may be malicious");
    }
};
var checkOutputs = function (outputs, myOutput) {
    var hasOutput = false;
    for (var i = 0; i < outputs.length; i++) {
        var checkItem = outputs[i];
        if (checkItem.toBuffer().equals(myOutput.toBuffer())) {
            hasOutput = true;
        }
    }
    if (!hasOutput) {
        throw Error("Your output is not recorded in the transaction, server or coinjoin participants may be malicious");
    }
};
var runSecurityChecks = function (inputs, outputs, myInput, myOutput, myUtxos) {
    checkInputs(inputs, myInput, myUtxos);
    checkOutputs(outputs, myOutput);
    console.log("All checks run, tx is good");
};
