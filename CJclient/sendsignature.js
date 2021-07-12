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
exports.sendsignature = void 0;
var avalanche_1 = require("avalanche");
var avm_1 = require("avalanche/dist/apis/avm");
var common_1 = require("avalanche/dist/common");
var processmessage_1 = require("./processmessage");
var crypto_1 = require("crypto");
var avalancheutils_1 = require("./avalancheutils");
var BNSCALE = 1000000000;
var bintools = avalanche_1.BinTools.getInstance();
var sendsignature = function (joinid, data, pubaddr, privatekey, networkID, input, output) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, keyData, utxoset, myutxos, inputs, outputs, inputData, outputData, i, inputObject, input_1, myInfo, myTxIndex, i, checkItem, hasUnwantedUTXOs, i, checkItem, j, testutxo, i, outputObject, output_1, i, checkItem, baseTx, unsignedTx, txbuff, msg, sigbuf, sig, returnData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(networkID);
                networkData = avalancheutils_1.generatexchain(networkID);
                keyData = avalancheutils_1.generatekeychain(networkData.xchain, privatekey);
                return [4 /*yield*/, networkData.xchain.getUTXOs(pubaddr)];
            case 1:
                utxoset = (_a.sent()).utxos;
                myutxos = utxoset.getAllUTXOs();
                console.log(myutxos);
                inputs = [];
                outputs = [];
                inputData = data["inputs"];
                outputData = data["outputs"];
                //construct inputs
                console.log("constructing tx from wiretx");
                console.log("constructing inputs");
                for (i = 0; i < inputData.length; i++) {
                    inputObject = inputData[i];
                    input_1 = new avm_1.TransferableInput();
                    input_1.fromBuffer(avalanche_1.Buffer.from(inputObject[0]));
                    inputs.push(input_1);
                }
                console.log("checking if my input is in list");
                myInfo = false;
                myTxIndex = 0;
                for (i = 0; i < inputs.length; i++) {
                    checkItem = inputs[i];
                    if (checkItem.getTxID().equals(input.getTxID()) && checkItem.getOutputIdx().equals(input.getOutputIdx())) {
                        myInfo = true;
                        myTxIndex = i;
                        break;
                    }
                }
                if (!myInfo) {
                    console.log("my input is not in input list");
                    throw Error;
                }
                hasUnwantedUTXOs = false;
                console.log("checking if any other of my utxos are in the list");
                for (i = 0; i < inputs.length; i++) {
                    checkItem = inputs[i];
                    if (i != myTxIndex) {
                        for (j = 0; j < myutxos.length; j++) {
                            testutxo = myutxos[j];
                            if (checkItem.getTxID().equals(testutxo.getTxID()) && checkItem.getOutputIdx().equals(testutxo.getOutputIdx())) {
                                hasUnwantedUTXOs = true;
                            }
                        }
                    }
                }
                if (hasUnwantedUTXOs) {
                    console.log("warning: one of your other utxos was included in the input list.  Another participant may be behaving maliciously");
                    throw Error;
                }
                console.log("input is in list");
                //construct outputs
                console.log("constructing outputs");
                for (i = 0; i < outputData.length; i++) {
                    outputObject = outputData[i];
                    output_1 = new avm_1.TransferableOutput();
                    output_1.fromBuffer(avalanche_1.Buffer.from(outputObject));
                    outputs.push(output_1);
                }
                console.log("checking if output is in list");
                myInfo = false;
                for (i = 0; i < outputs.length; i++) {
                    checkItem = outputs[i];
                    console.log(checkItem);
                    if (checkItem.toBuffer().equals(output.toBuffer())) {
                        myInfo = true;
                    }
                }
                console.log("checking if any of my other utxos are in this list");
                if (!myInfo) {
                    console.log("my output is not in output list");
                    throw Error;
                }
                console.log("output is in list");
                console.log("constructing transaction");
                baseTx = new avm_1.BaseTx(networkID, networkData.xchainidBuf, outputs, inputs, avalanche_1.Buffer.from("test"));
                unsignedTx = new avm_1.UnsignedTx(baseTx);
                console.log("creating signature");
                txbuff = unsignedTx.toBuffer();
                msg = avalanche_1.Buffer.from(crypto_1.createHash("sha256").update(txbuff).digest());
                sigbuf = keyData.myKeyPair.sign(msg);
                sig = new common_1.Signature();
                sig.fromBuffer(sigbuf);
                console.log("transaction signed, sending sig to coinJoin");
                returnData = {
                    "joinid": joinid,
                    "messagetype": 4,
                    "signature": sig.toBuffer(),
                    "pubaddr": pubaddr,
                    "transaction": txbuff
                };
                processmessage_1.sendRecieve(returnData, networkID);
                return [2 /*return*/];
        }
    });
}); };
exports.sendsignature = sendsignature;
