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
var issuestx_1 = require("./issuestx");
var bintools = avalanche_1.BinTools.getInstance();
var send_signature = function (join_ID, data, pub_addr, private_key, network_ID, ip, my_input, my_output) { return __awaiter(void 0, void 0, void 0, function () {
    var network_data, key_type, tx_buf, unsigned_tx, inputs, outputs, msg, sig_buf, sig, key_data, utxo_set, my_utxos, my_wallet, my_key, sig_string, send_data, return_data, log_data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                network_data = avalancheutils_1.generate_xchain(network_ID);
                key_type = avalancheutils_1.get_key_type(private_key);
                tx_buf = avalanche_1.Buffer.from(data);
                unsigned_tx = new avm_1.UnsignedTx();
                unsigned_tx.fromBuffer(tx_buf);
                inputs = unsigned_tx.getTransaction().getIns();
                outputs = unsigned_tx.getTransaction().getOuts();
                msg = avalanche_1.Buffer.from(crypto_1.createHash("sha256").update(tx_buf).digest());
                sig_buf = undefined;
                sig = new common_1.Signature();
                if (!(key_type == 0)) return [3 /*break*/, 2];
                key_data = avalancheutils_1.generate_key_chain(network_data.xchain, private_key);
                return [4 /*yield*/, network_data.xchain.getUTXOs(pub_addr)];
            case 1:
                utxo_set = (_a.sent()).utxos;
                my_utxos = utxo_set.getAllUTXOs();
                run_security_checks(inputs, outputs, my_input, my_output, my_utxos);
                sig_buf = key_data.my_key_pair.sign(msg);
                sig.fromBuffer(sig_buf);
                return [3 /*break*/, 5];
            case 2:
                if (!(key_type == 1)) return [3 /*break*/, 5];
                my_wallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(private_key);
                return [4 /*yield*/, my_wallet.resetHdIndices()];
            case 3:
                _a.sent();
                return [4 /*yield*/, my_wallet.updateUtxosX()];
            case 4:
                _a.sent();
                run_security_checks(inputs, outputs, my_input, my_output, my_wallet.utxosX.getAllUTXOs());
                my_key = my_wallet.getKeyChainX().getKey(network_data.xchain.parseAddress(pub_addr));
                sig_string = my_key.sign(msg);
                sig.fromBuffer(sig_string);
                _a.label = 5;
            case 5:
                send_data = {
                    "join_ID": join_ID,
                    "message_type": consts.COLLECT_SIGS,
                    "sig": sig.toBuffer(),
                    "pub_addr": pub_addr
                };
                return [4 /*yield*/, processmessage_1.send_recieve(send_data, ip)];
            case 6:
                return_data = (_a.sent());
                if (return_data.length == 1) {
                    console.log("server did not issue in a timely manner, manually issuing tx");
                    issuestx_1.issuetx(return_data[0], network_ID);
                }
                else {
                    console.log("server succesfully issued tx of id " + return_data[1]);
                }
                log_data = "successfully sent signature to CJ of id " + join_ID + " using address " + pub_addr + ".";
                return [2 /*return*/];
        }
    });
}); };
exports.send_signature = send_signature;
var check_inputs = function (inputs, my_input, my_utxos) {
    var has_input = false;
    var unwanted_utxo_count = 0;
    for (var i = 0; i < inputs.length; i++) {
        var check_item = inputs[i];
        if (check_item.getTxID().equals(my_input.getTxID()) && check_item.getOutputIdx().equals(my_input.getOutputIdx())) {
            has_input = true;
        }
        else {
            for (var j = 0; j < my_utxos.length; j++) {
                var test_utxo = my_utxos[j];
                if (check_item.getTxID().equals(test_utxo.getTxID()) && check_item.getOutputIdx().equals(test_utxo.getOutputIdx())) {
                    unwanted_utxo_count++;
                    break;
                }
            }
        }
    }
    if (!has_input) {
        throw Error("Your input is not recorded in the transaction, server or coinjoin participants may be malicious");
    }
    if (unwanted_utxo_count > 0) {
        throw Error(unwanted_utxo_count + " other utxo(s) that you own were recorded in the tx.  Server or cj participants may be malicious");
    }
};
var check_outputs = function (outputs, my_output) {
    var has_output = false;
    for (var i = 0; i < outputs.length; i++) {
        var check_item = outputs[i];
        if (check_item.toBuffer().equals(my_output.toBuffer())) {
            has_output = true;
        }
    }
    if (!has_output) {
        throw Error("Your output is not recorded in the transaction, server or coinjoin participants may be malicious");
    }
};
var run_security_checks = function (inputs, outputs, my_input, my_output, my_utxos) {
    check_inputs(inputs, my_input, my_utxos);
    check_outputs(outputs, my_output);
    console.log("All checks run, tx is good");
};
