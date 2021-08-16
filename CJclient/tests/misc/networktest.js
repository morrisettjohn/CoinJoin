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
var avalanche_1 = require("avalanche");
var crypto_1 = require("crypto");
var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var mnemonicKey = "dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing";
var mnemonic2 = "defense seven hip situate stool outer float ball fine piano unable slim system ring path voyage rabbit inside power agree tomorrow rich fabric woman";
var bintools = avalanche_1.BinTools.getInstance();
var test = function (networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var wallet, networkData, keyData, xchain, tx, x, z, v, t, y, c, d, b, a, n, m;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                wallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(mnemonic2);
                console.log(wallet.getKeyChainX());
                networkData = avalancheutils_1.generate_xchain(5);
                keyData = avalancheutils_1.generate_key_chain(networkData.xchain, "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY");
                xchain = networkData.xchain;
                tx = new avm_1.Tx();
                return [4 /*yield*/, networkData.xchain.getTx("2GBGr6CdKFpoDzd7YiS3Vu8XpRjUCqcxHvQ7EKTZBwy3zE8Gv2")];
            case 1:
                x = _a.sent();
                tx.fromString(x);
                z = tx.getUnsignedTx().getTransaction().getIns()[0].toBuffer();
                v = tx.getUnsignedTx().getTransaction().getOuts()[0].toBuffer();
                console.log(z);
                t = bintools.cb58Encode(z);
                console.log(t);
                console.log(bintools.cb58Decode(t));
                console.log(bintools.cb58Encode(new avalanche_1.Buffer(t)));
                y = avalanche_1.Buffer.concat([z, v]);
                c = avalanche_1.Buffer.from(crypto_1.createHash("sha256").update(new avalanche_1.Buffer(y)).digest());
                d = bintools.cb58Encode(c);
                b = bintools.bufferToB58(z);
                a = bintools.bufferToB58(y);
                n = new avalanche_1.Buffer(x);
                m = avalanche_1.Buffer.from(crypto_1.createHash("sha256").update(n).digest());
                return [2 /*return*/];
        }
    });
}); };
var hest = function () { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, wallet, b;
    return __generator(this, function (_a) {
        networkData = avalancheutils_1.generate_xchain(5);
        wallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(mnemonic2);
        console.log(wallet.getExternalAddressesX());
        b = wallet.getKeyChainX();
        console.log(b.getAddressStrings());
        return [2 /*return*/];
    });
}); };
var best = function () { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, t, z, b, v;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                networkData = avalancheutils_1.generate_xchain(5);
                t = "sport fee fever myself private monster ladder leaf ritual month near can exhaust skin weird morning umbrella earn stone orphan enemy dry party ecology";
                z = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(t);
                return [4 /*yield*/, z.resetHdIndices()];
            case 1:
                _a.sent();
                b = z.getKeyChainX();
                v = networkData.xchain.parseAddress(z.getExternalAddressesX()[0]);
                console.log(b.getKey(v));
                return [2 /*return*/];
        }
    });
}); };
var vest = function () { return __awaiter(void 0, void 0, void 0, function () {
    var network_data, key_data, time, time_buf, sig, time_hash;
    return __generator(this, function (_a) {
        network_data = avalancheutils_1.generate_xchain(5);
        key_data = avalancheutils_1.generate_key_chain(network_data.xchain, "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2");
        time = new avalanche_1.BN(new Date().getTime());
        time_buf = avalanche_1.Buffer.from(time.toBuffer());
        sig = key_data.my_key_pair.sign(new avalanche_1.Buffer("1"));
        time_hash = avalanche_1.Buffer.from(crypto_1.createHash("sha256").update(sig).digest("hex"));
        console.log(time_hash.toString().length);
        return [2 /*return*/];
    });
}); };
vest();
