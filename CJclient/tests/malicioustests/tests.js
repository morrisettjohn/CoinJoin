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
var avalancheutils_1 = require("../../avalancheutils");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var sendinputdata_1 = require("../../sendinputdata");
var bintools = avalanche_1.BinTools.getInstance();
var network_ID = 5;
var network_data = avalancheutils_1.generate_xchain(network_ID);
var avax_ID = "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK";
var random_asset_ID = "tavQgYcWe2PeASxiGsjbmGUSJsUXKMRUTNXaA3KTSi77NrzVv";
var private_key_good = "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2";
var good_key_data = avalancheutils_1.generate_key_chain(network_data.xchain, private_key_good);
var good_pub_addr = good_key_data.my_addr_strings[0];
var private_key_bad = "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY";
var bad_key_data = avalancheutils_1.generate_key_chain(network_data.xchain, private_key_bad);
var bad_pub_addr = bad_key_data.my_addr_strings[0];
var test_join_ID = 6;
var test_ip = "100.64.15.72:65432";
var send_data = function () { return __awaiter(void 0, void 0, void 0, function () {
    var good_output, spent_input, input_wrong_utxo, input_wrong_asset_ID, input_not_owned;
    return __generator(this, function (_a) {
        good_output = sendinputdata_1.craft_output(1, avax_ID, "X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443", 5);
        spent_input = sendinputdata_1.craft_input(1.15, avax_ID, "2q4uXSdmGSDZUy2xNPfd57aH4vLgq1vxQzuaMG4gp8aBdAdrPB", 1, good_pub_addr, 5);
        input_wrong_utxo = sendinputdata_1.craft_input(1.15, avax_ID, "2SRZf59TwWfV4tEUgWjy23PuwPFsVrTnnEdHRB5g5cUd6sSNns", 0, good_pub_addr, 5);
        input_wrong_asset_ID = sendinputdata_1.craft_input(1.15, random_asset_ID, "2GYdNLKu8pYY51BM6JzDooBV9VUGh5kHmN7C6Gs3MbUi25hSUP", 0, good_pub_addr, 5);
        input_not_owned = sendinputdata_1.craft_input(1.15, avax_ID, "GKCWP1RcPJTK7YzQfjyKUUMwyMu1dm7qDp3rnkAVq6yZw8uvD", 1, good_pub_addr, 5);
        console.log(good_pub_addr);
        console.log(bad_pub_addr);
        /*const send_data = {
            "join_ID": test_join_ID,
            "message_type": consts.COLLECT_INPUTS,
            "pub_addr": good_pub_addr,
            "nonce": good_nonce,
            "nonce_sig": good_nonce_sig,
            "input_buf": spent_input.toBuffer(),
            "output_buf": good_output.toBuffer()
        }*/
        //const recieved_data = (await send_recieve(send_data, test_ip))[0]
        console.log(good_output.toBuffer().length);
        console.log(bintools.cb58Encode(good_output.toBuffer()).length);
        return [2 /*return*/];
    });
}); };
send_data();
/*const send_data = {
    "join_ID": test_join_ID,
    "message_type": consts.COLLECT_INPUTS,
    "pub_addr": pub_addr,
    "nonce": nonce,
    "nonce_sig": nonce_sig,
    "input_buf": input.toBuffer(),
    "output_buf": output.toBuffer()
}*/ 
