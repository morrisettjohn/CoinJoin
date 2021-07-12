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
var avm_1 = require("avalanche/dist/apis/avm");
var avalancheutils_1 = require("../avalancheutils");
var avalanche_1 = require("avalanche");
var avalanche_2 = require("avalanche");
var crypto_1 = require("crypto");
var avalanche_3 = require("avalanche");
var crypto_2 = require("crypto");
require("module-alias/register");
var MnemonicWallet_1 = require("../../avalanche-wallet/src/js/wallets/MnemonicWallet");
var test = function (networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, xchain, keyData, myUTXOs, utxos, testTx, txid;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                networkData = avalancheutils_1.generatexchain(networkID);
                xchain = networkData.xchain;
                keyData = avalancheutils_1.generatekeychain(xchain, "PrivateKey-ji3ENE83u1451cu8GCaL1mHYdn9tDUL2L8hJtEHsTSJNVEnbd");
                return [4 /*yield*/, xchain.getUTXOs(keyData.myAddressStrings)];
            case 1:
                myUTXOs = (_a.sent()).utxos;
                utxos = myUTXOs.getAllUTXOs();
                utxos.forEach(function (item) {
                    console.log(item.getUTXOID());
                });
                testTx = new avm_1.Tx();
                return [4 /*yield*/, (xchain.getTx("2p3kj5KqvF1rcqjqYrupDYnGMYuJEHiGY3ovU5h3r7v5P3fJPi"))];
            case 2:
                txid = _a.sent();
                testTx.fromString(txid);
                testTx.getUnsignedTx().getTransaction().getIns();
                return [2 /*return*/];
        }
    });
}); };
var test2 = function (networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, xchain, xKeyChain, mnemonic, strength, wordlist, m, seed, hdnode, i, child, xAddressStrings;
    return __generator(this, function (_a) {
        networkData = avalancheutils_1.generatexchain(networkID);
        xchain = networkData.xchain;
        xKeyChain = networkData.xchain.keyChain();
        mnemonic = avalanche_2.Mnemonic.getInstance();
        strength = 256;
        wordlist = mnemonic.getWordlists("english");
        m = mnemonic.generateMnemonic(strength, crypto_1.randomBytes, wordlist);
        seed = mnemonic.mnemonicToSeedSync(m);
        hdnode = new avalanche_3.HDNode(seed);
        for (i = 0; i <= 2; i++) {
            child = hdnode.derive("m/44'/9000'/0'/0/" + i);
            xKeyChain.importKey(child.privateKeyCB58);
        }
        xAddressStrings = xchain.keyChain().getAddressStrings();
        console.log(xAddressStrings);
        return [2 /*return*/];
    });
}); };
var test3 = function (networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, xchain, mnemonic, seed, hdnode;
    return __generator(this, function (_a) {
        networkData = avalancheutils_1.generatexchain(networkID);
        xchain = networkData.xchain;
        mnemonic = avalanche_2.Mnemonic.getInstance();
        seed = mnemonic.mnemonicToSeedSync("dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing");
        console.log(seed);
        hdnode = new avalanche_3.HDNode(seed);
        return [2 /*return*/];
    });
}); };
var sign = function (message) {
    var pkey = "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2";
    var publickey = "X-fuji13a3dm204mh9hfjx3ajpk33cchgszh2qry97ml9";
    var networkData = avalancheutils_1.generatexchain(5);
    var keyData = avalancheutils_1.generatekeychain(networkData.xchain, pkey);
    var msgbuf = avalanche_1.Buffer.from(message);
    var msghash = avalanche_1.Buffer.from(crypto_2.createHash("sha256").update(msgbuf).digest());
    console.log(crypto_2.createHash("sha256").update(msgbuf).digest());
    var signedmsg = keyData.myKeyPair.sign(msghash);
};
var mnemonicKey = "dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing";
var test4 = function (networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var mwallet, current_key;
    return __generator(this, function (_a) {
        mwallet = new MnemonicWallet_1["default"](mnemonicKey);
        current_key = mwallet.getCurrentKey();
        console.log(current_key);
        return [2 /*return*/];
    });
}); };
var args = process.argv.slice(2);
//test(parseInt(args[0]))
test4(5);
