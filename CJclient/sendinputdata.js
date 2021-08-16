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
var processmessage_1 = require("./processmessage");
var avalancheutils_1 = require("./avalancheutils");
var constants_1 = require("./constants");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var consts = require("./constants");
var requestnonce_1 = require("./requestnonce");
var addlog_1 = require("./addlog");
//setting up the xchain object
var bintools = avalanche_1.BinTools.getInstance();
var send_input_data = function (join_ID, asset_ID, input_amount, output_amount, dest_addr, private_key, network_ID, join_tx_ID, server_addr, ip) { return __awaiter(void 0, void 0, void 0, function () {
    var network_data, xchain, sent_data, tx_ID, tx_index, pub_addr_buf, pub_addr, input, output, nonce_sig_pair, nonce, nonce_sig, recieved_data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                network_data = avalancheutils_1.generate_xchain(network_ID);
                xchain = network_data.xchain;
                return [4 /*yield*/, send_target_amount(network_ID, private_key, input_amount, asset_ID)];
            case 1:
                sent_data = _a.sent();
                tx_ID = sent_data["tx_ID"];
                tx_index = sent_data["tx_index"];
                pub_addr_buf = sent_data["pub_addr_buf"];
                pub_addr = xchain.addressFromBuffer(pub_addr_buf);
                input = craft_input(input_amount, asset_ID, tx_ID, tx_index, pub_addr, network_ID);
                output = craft_output(output_amount, asset_ID, dest_addr, network_ID);
                return [4 /*yield*/, requestnonce_1.request_nonce(join_ID, pub_addr, private_key, network_ID, ip)];
            case 2:
                nonce_sig_pair = _a.sent();
                nonce = nonce_sig_pair[0];
                nonce_sig = nonce_sig_pair[1];
                construct_log(join_tx_ID, join_ID, ip, network_ID, pub_addr, server_addr, input, output);
                return [4 /*yield*/, send_data(join_ID, pub_addr, nonce, nonce_sig, input, output, ip)];
            case 3:
                recieved_data = _a.sent();
                return [2 /*return*/, [recieved_data, input, output, pub_addr]];
        }
    });
}); };
exports.send_input_data = send_input_data;
var construct_log = function (join_tx_ID, join_ID, ip, network_ID, user_addr, server_addr, input, output) { return __awaiter(void 0, void 0, void 0, function () {
    var join_tx_data, user_data;
    return __generator(this, function (_a) {
        join_tx_data = {
            "server_addr": server_addr,
            "join_tx_ID": join_tx_ID,
            "join_ID": join_ID,
            "host": ip,
            "network_ID": network_ID,
            "users": {}
        };
        user_data = {
            "pub_addr": user_addr,
            "input": input.toBuffer(),
            "output": output.toBuffer(),
            "last_status": consts.COLLECT_INPUTS,
            "time": new Date().getTime()
        };
        addlog_1.add_log(server_addr, join_tx_ID, join_tx_data, user_addr, user_data);
        return [2 /*return*/];
    });
}); };
var craft_input = function (input_amount, asset_ID, tx_ID, tx_index, pubaddr, network_ID) {
    var network_data = avalancheutils_1.generate_xchain(network_ID);
    var xchain = network_data.xchain;
    var asset_ID_buf = bintools.cb58Decode(asset_ID);
    var pub_addr_buf = xchain.parseAddress(pubaddr);
    var inp_amount = new avalanche_1.BN(input_amount * constants_1.BNSCALE);
    var tx_ID_buf = bintools.cb58Decode(tx_ID);
    var output_idx = avalanche_1.Buffer.alloc(4);
    output_idx.writeIntBE(tx_index, 0, 4);
    var secp_transfer_input = new avm_1.SECPTransferInput(inp_amount);
    secp_transfer_input.addSignatureIdx(0, pub_addr_buf);
    var input = new avm_1.TransferableInput(tx_ID_buf, output_idx, asset_ID_buf, secp_transfer_input);
    return input;
};
var craft_output = function (output_amount, asset_ID, dest_addr, network_ID) {
    var network_data = avalancheutils_1.generate_xchain(network_ID);
    var xchain = network_data.xchain;
    var asset_ID_buf = bintools.cb58Decode(asset_ID);
    var out_amount = new avalanche_1.BN(output_amount * constants_1.BNSCALE);
    var output_addr_buf = [xchain.parseAddress(dest_addr)];
    var secp_tranfser_output = new avm_1.SECPTransferOutput(out_amount, output_addr_buf);
    var output = new avm_1.TransferableOutput(asset_ID_buf, secp_tranfser_output);
    return output;
};
var send_target_amount = function (network_ID, private_key, input_amount, asset_ID) { return __awaiter(void 0, void 0, void 0, function () {
    var network_data, xchain, fee, inp_amount, inp_amount_fee, key_type, signed_tx, key_data, key_chain_addrs, pub_addr_buf_1, pub_addr, utxo_set, balance, unsigned_tx, my_wallet, from, to, change, wallet_utxos, unsigned_tx, tx_ID, status, outs, tx_index, i, pub_addr_buf;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                network_data = avalancheutils_1.generate_xchain(network_ID);
                xchain = network_data.xchain;
                fee = xchain.getDefaultTxFee();
                inp_amount = new avalanche_1.BN(input_amount * constants_1.BNSCALE);
                inp_amount_fee = inp_amount.add(fee);
                key_type = avalancheutils_1.get_key_type(private_key);
                signed_tx = new avm_1.Tx();
                if (!(key_type == 0)) return [3 /*break*/, 5];
                key_data = avalancheutils_1.generate_key_chain(network_data.xchain, private_key);
                key_chain_addrs = key_data.my_addr_strings;
                pub_addr_buf_1 = key_data.my_addr_buf;
                pub_addr = xchain.addressFromBuffer(pub_addr_buf_1[0]);
                return [4 /*yield*/, xchain.getUTXOs(pub_addr)];
            case 1:
                utxo_set = (_a.sent()).utxos;
                balance = utxo_set.getBalance(pub_addr_buf_1, asset_ID);
                if (!balance.gte(inp_amount_fee)) return [3 /*break*/, 3];
                return [4 /*yield*/, xchain.buildBaseTx(utxo_set, inp_amount, asset_ID, key_chain_addrs, key_chain_addrs, key_chain_addrs)];
            case 2:
                unsigned_tx = _a.sent();
                signed_tx = unsigned_tx.sign(key_data.x_key_chain);
                return [3 /*break*/, 4];
            case 3:
                console.log("insufficient funds");
                throw Error; //XXX fix this later
            case 4: return [3 /*break*/, 11];
            case 5:
                if (!(key_type == 1)) return [3 /*break*/, 11];
                my_wallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(private_key);
                return [4 /*yield*/, my_wallet.resetHdIndices()];
            case 6:
                _a.sent();
                return [4 /*yield*/, my_wallet.updateUtxosX()];
            case 7:
                _a.sent();
                from = my_wallet.getAllAddressesX();
                to = my_wallet.getAddressX();
                change = my_wallet.getChangeAddressX();
                wallet_utxos = my_wallet.utxosX;
                if (!my_wallet.getBalanceX()[asset_ID].unlocked.gte(inp_amount_fee)) return [3 /*break*/, 10];
                return [4 /*yield*/, xchain.buildBaseTx(wallet_utxos, inp_amount, asset_ID, [to], from, [change])];
            case 8:
                unsigned_tx = _a.sent();
                return [4 /*yield*/, my_wallet.signX(unsigned_tx)];
            case 9:
                signed_tx = _a.sent();
                return [3 /*break*/, 11];
            case 10: throw Error("insufficient funds in wallet");
            case 11: return [4 /*yield*/, xchain.issueTx(signed_tx)];
            case 12:
                tx_ID = _a.sent();
                console.log("issued");
                status = "";
                _a.label = 13;
            case 13:
                if (!(status != "Accepted" && status != "Rejected")) return [3 /*break*/, 15];
                return [4 /*yield*/, xchain.getTxStatus(tx_ID)];
            case 14:
                status = _a.sent();
                return [3 /*break*/, 13];
            case 15:
                if (status === "Rejected") {
                    throw Error("rejected, not submitting to coinjoin");
                }
                console.log("Accepted");
                outs = signed_tx.getUnsignedTx().getTransaction().getOuts();
                tx_index = 0;
                for (i = 0; i < outs.length; i++) {
                    if (outs[i].getOutput().getAmount().eq(inp_amount)) {
                        break;
                    }
                    tx_index += 1;
                }
                pub_addr_buf = signed_tx.getUnsignedTx().getTransaction().getOuts()[tx_index].getOutput().getAddress(0);
                return [2 /*return*/, { "tx_ID": tx_ID, "tx_index": tx_index, "pub_addr_buf": pub_addr_buf }];
        }
    });
}); };
var send_data = function (join_ID, pub_addr, nonce, nonce_sig, input, output, ip) { return __awaiter(void 0, void 0, void 0, function () {
    var send_data, recieved_data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                send_data = {
                    "join_ID": join_ID,
                    "message_type": consts.COLLECT_INPUTS,
                    "pub_addr": pub_addr,
                    "nonce": nonce,
                    "nonce_sig": nonce_sig,
                    "input_buf": input.toBuffer(),
                    "output_buf": output.toBuffer()
                };
                console.log("sending data to coinjoin server now");
                return [4 /*yield*/, processmessage_1.send_recieve(send_data, ip)];
            case 1:
                recieved_data = (_a.sent())[0];
                return [2 /*return*/, recieved_data];
        }
    });
}); };
