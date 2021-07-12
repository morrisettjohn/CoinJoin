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
exports.sendutxodata = void 0;
var avalanche_1 = require("avalanche");
var avm_1 = require("avalanche/dist/apis/avm");
var processmessage_1 = require("./processmessage");
var avalancheutils_1 = require("./avalancheutils");
//setting up the xchain object
var BNSCALE = 1000000000;
var bintools = avalanche_1.BinTools.getInstance();
var sendutxodata = function (joinid, assetid, inputamount, outputamount, destinationaddr, pubaddr, privatekey, networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, keyData, xchain, myAddressBuf, inputs, outputs, fee, targetInpAmountFormatted, targetInpAmountFormatBN, targetInpAmountWithFee, targetOutAmountFormatted, targetOutAmountFormatBN, utxoset, utxos, balance, inputTotal, assetidBuf, i, current_utxo, utxooutput, txid_1, outputidx_1, utxoamt, secpTransferInput_1, transferableinput, changetotal, targetOutput, transferableTargetOutput, changeOutput, transferableChangeOutput, baseTx, outs, txindex, i, unsignedTx, signedTx, id, status, txidstring, txid, outputidx, secpTransferInput, input, outputaddressBuf, secpTransferOutput, output, returnData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                networkData = avalancheutils_1.generatexchain(networkID);
                console.log(privatekey);
                console.log("here");
                keyData = avalancheutils_1.generatekeychain(networkData.xchain, privatekey);
                xchain = networkData.xchain;
                myAddressBuf = keyData.myAddressBuf;
                inputs = [];
                outputs = [];
                fee = xchain.getDefaultTxFee();
                targetInpAmountFormatted = inputamount * BNSCALE;
                targetInpAmountFormatBN = new avalanche_1.BN(targetInpAmountFormatted);
                targetInpAmountWithFee = targetInpAmountFormatBN.add(fee);
                targetOutAmountFormatted = outputamount * BNSCALE;
                targetOutAmountFormatBN = new avalanche_1.BN(targetOutAmountFormatted);
                return [4 /*yield*/, xchain.getUTXOs(pubaddr)];
            case 1:
                utxoset = (_a.sent()).utxos;
                utxos = utxoset.getAllUTXOs();
                balance = utxoset.getBalance(myAddressBuf, assetid);
                inputTotal = new avalanche_1.BN(0);
                assetidBuf = bintools.cb58Decode(assetid);
                console.log("checking funds in account");
                //cycle through utxos until enough currency has been collected
                if (balance.toNumber() >= targetInpAmountWithFee.toNumber()) {
                    for (i = 0; i < utxos.length && inputTotal.toNumber() < targetInpAmountWithFee.toNumber(); i++) {
                        current_utxo = utxos[i];
                        utxooutput = utxos[i].getOutput();
                        if (utxooutput._typeID !== 11) {
                            txid_1 = current_utxo.getTxID();
                            outputidx_1 = current_utxo.getOutputIdx();
                            utxoamt = utxooutput.getAmount().clone();
                            inputTotal = inputTotal.add(utxoamt);
                            secpTransferInput_1 = new avm_1.SECPTransferInput(utxoamt);
                            secpTransferInput_1.addSignatureIdx(0, myAddressBuf[0]);
                            transferableinput = new avm_1.TransferableInput(txid_1, outputidx_1, assetidBuf, secpTransferInput_1);
                            inputs.push(transferableinput);
                        }
                    }
                }
                else {
                    console.log("insufficient funds");
                    throw Error; //XXX fix this later
                }
                console.log("sufficient funds, creating input utxo");
                changetotal = inputTotal.sub(targetInpAmountWithFee);
                targetOutput = new avm_1.SECPTransferOutput(targetInpAmountFormatBN, myAddressBuf);
                transferableTargetOutput = new avm_1.TransferableOutput(assetidBuf, targetOutput);
                outputs.push(transferableTargetOutput);
                if (changetotal.toNumber() > 0) {
                    changeOutput = new avm_1.SECPTransferOutput(changetotal, myAddressBuf);
                    transferableChangeOutput = new avm_1.TransferableOutput(assetidBuf, changeOutput);
                    outputs.push(transferableChangeOutput);
                }
                baseTx = new avm_1.BaseTx(networkID, networkData.xchainidBuf, outputs, inputs, avalanche_1.Buffer.from("test"));
                outs = baseTx.getOuts();
                txindex = 0;
                for (i = 0; i < outs.length; i++) {
                    if (outs[i].getOutput().getAmount().toNumber() == targetInpAmountFormatted) {
                        break;
                    }
                    txindex += 1;
                }
                unsignedTx = new avm_1.UnsignedTx(baseTx);
                signedTx = unsignedTx.sign(keyData.xKeyChain);
                return [4 /*yield*/, xchain.issueTx(signedTx)];
            case 2:
                id = _a.sent();
                console.log("issued");
                status = "";
                _a.label = 3;
            case 3:
                if (!(status != "Accepted" && status != "Rejected")) return [3 /*break*/, 5];
                return [4 /*yield*/, xchain.getTxStatus(id)];
            case 4:
                status = _a.sent();
                return [3 /*break*/, 3];
            case 5:
                if (status === "Rejected") {
                    throw Error("rejected, not submitting to coinjoin");
                }
                console.log("constructing my input");
                txidstring = id;
                txid = bintools.cb58Decode(txidstring);
                outputidx = avalanche_1.Buffer.alloc(4);
                outputidx.writeIntBE(txindex, 0, 4);
                secpTransferInput = new avm_1.SECPTransferInput(targetInpAmountFormatBN);
                secpTransferInput.addSignatureIdx(0, myAddressBuf[0]);
                input = new avm_1.TransferableInput(txid, outputidx, assetidBuf, secpTransferInput);
                console.log("constructing my output");
                outputaddressBuf = [xchain.parseAddress(destinationaddr)];
                secpTransferOutput = new avm_1.SECPTransferOutput(targetOutAmountFormatBN, outputaddressBuf);
                output = new avm_1.TransferableOutput(assetidBuf, secpTransferOutput);
                returnData = {
                    "joinid": joinid,
                    "messagetype": 3,
                    "pubaddr": pubaddr,
                    "inputbuf": input.toBuffer(),
                    "outputbuf": output.toBuffer()
                };
                console.log("sending data to coinjoin server now");
                processmessage_1.sendRecieve(returnData, networkID, joinid, pubaddr, privatekey, input, output);
                return [2 /*return*/];
        }
    });
}); };
exports.sendutxodata = sendutxodata;
