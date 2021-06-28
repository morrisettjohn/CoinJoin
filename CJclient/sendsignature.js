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
var http_1 = require("http");
var utils_1 = require("avalanche/dist/utils");
var issuetx_1 = require("./issuetx");
var crypto_1 = require("crypto");
var BNSCALE = 1000000000;
var bintools = avalanche_1.BinTools.getInstance();
var Ip = "api.avax-test.network";
var networkID = 5;
var port = 443;
var protocol = "https";
var xchainid = utils_1.Defaults.network[networkID].X.blockchainID;
var xchainidBuf = bintools.cb58Decode(xchainid);
var avax = new avalanche_1.Avalanche(Ip, port, protocol, networkID, xchainid);
avax.setRequestConfig('withCredentials', true);
var xchain = avax.XChain();
var fee = xchain.getDefaultTxFee();
var sendsignature = function (joinid, data, pubaddr, privatekey) { return __awaiter(void 0, void 0, void 0, function () {
    var inputs, outputs, inputData, outputData, xKeyChain, myKeyPair, myAddressBuf, myAddressStrings, i, inputObject, amt, txidstring, txid, outputidx, assetid, assetidBuf, secpTransferInput, input, i, outputObject, amt, outputaddress, outputaddressBuf, assetid, assetidBuf, secpTransferOutput, transferableOutput, baseTx, unsignedTx, txbuff, msg, sigbuf, sig, returndata, returndatastring, options, recievedData, req;
    return __generator(this, function (_a) {
        inputs = [];
        outputs = [];
        inputData = data["inputs"];
        outputData = data["outputs"];
        xKeyChain = xchain.keyChain();
        myKeyPair = xKeyChain.importKey(privatekey);
        myAddressBuf = xchain.keyChain().getAddresses();
        myAddressStrings = xchain.keyChain().getAddressStrings();
        //construct inputs
        console.log("constructing tx");
        for (i = 0; i < inputData.length; i++) {
            inputObject = inputData[i];
            console.log(inputData);
            amt = new avalanche_1.BN(inputObject["amount"] * BNSCALE);
            txidstring = inputObject["transactionid"];
            txid = bintools.cb58Decode(txidstring);
            outputidx = avalanche_1.Buffer.alloc(4);
            outputidx.writeIntBE(inputObject["transactionoffset"], 0, 4);
            assetid = inputObject["assetid"];
            assetidBuf = bintools.cb58Decode(assetid);
            secpTransferInput = new avm_1.SECPTransferInput(amt);
            secpTransferInput.addSignatureIdx(0, avalanche_1.Buffer.from(inputObject["pubaddr"]));
            console.log(secpTransferInput.getSigIdxs()[0]);
            input = new avm_1.TransferableInput(txid, outputidx, assetidBuf, secpTransferInput);
            console.log("here");
            inputs.push(input);
        }
        //construct outputs
        for (i = 0; i < outputData.length; i++) {
            outputObject = outputData[i];
            amt = new avalanche_1.BN(outputObject["amount"] * BNSCALE);
            outputaddress = outputObject["destinationaddr"];
            outputaddressBuf = [xchain.parseAddress(outputaddress)];
            assetid = outputObject["assetid"];
            assetidBuf = bintools.cb58Decode(assetid);
            secpTransferOutput = new avm_1.SECPTransferOutput(amt, outputaddressBuf);
            transferableOutput = new avm_1.TransferableOutput(assetidBuf, secpTransferOutput);
            outputs.push(transferableOutput);
        }
        baseTx = new avm_1.BaseTx(networkID, bintools.cb58Decode(xchainid), outputs, inputs, avalanche_1.Buffer.from("test"));
        unsignedTx = new avm_1.UnsignedTx(baseTx);
        console.log("creating signature");
        txbuff = unsignedTx.toBuffer().toString();
        msg = avalanche_1.Buffer.from(crypto_1.createHash("sha256").update(txbuff).digest());
        sigbuf = myKeyPair.sign(msg);
        sig = new common_1.Signature();
        sig.fromBuffer(sigbuf);
        returndata = {
            "joinid": joinid,
            "messagetype": 4,
            "signature": sig.toBuffer(),
            "pubaddr": pubaddr,
            "transaction": txbuff,
            "inputorder": "2"
        };
        returndatastring = JSON.stringify(returndata);
        options = {
            host: "192.168.129.105",
            port: "65432",
            method: "POST",
            headers: {
                "Content-Length": avalanche_1.Buffer.byteLength(returndatastring)
            }
        };
        console.log("sending data");
        recievedData = new avalanche_1.Buffer("");
        req = http_1.request(options, function (res) {
            res.on("data", function (d) {
                recievedData = new avalanche_1.Buffer(d);
            });
            res.on("end", function () {
                issuetx_1.issuetx(JSON.parse(recievedData.toString()));
            });
        });
        req.write(returndatastring);
        req.end();
        return [2 /*return*/];
    });
}); };
exports.sendsignature = sendsignature;
