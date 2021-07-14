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
var constants_1 = require("../constants");
var avm_2 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_wallet_sdk_1 = require("@avalabs/avalanche-wallet-sdk");
var utils_1 = require("avalanche/dist/utils");
var mnemonicKey = "dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing";
var bintools = avalanche_1.BinTools.getInstance();
var test = function (networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, xchain, avaxAssetID, mwallet, outputaddressBuf, id, txid, outputidx, assetidBuf, secpTransferInput, input, secpTransferOutput, output, baseTx, unsignedTx, txbuff, tx, standardTx;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                networkData = avalancheutils_1.generatexchain(5);
                xchain = networkData.xchain;
                avaxAssetID = utils_1.Defaults.network[networkID].X.avaxAssetID;
                avalanche_wallet_sdk_1.Network.setNetwork(avalanche_wallet_sdk_1.NetworkConstants.TestnetConfig); //if you want to switch pass it through again
                mwallet = avalanche_wallet_sdk_1.MnemonicWallet.fromMnemonic(mnemonicKey);
                return [4 /*yield*/, mwallet.resetHdIndices()];
            case 1:
                _a.sent();
                return [4 /*yield*/, mwallet.updateUtxosX()];
            case 2:
                _a.sent();
                outputaddressBuf = [xchain.parseAddress(mwallet.getAddressX())];
                id = "Lj6TJDDb7NVZM59YLZdpKsZDkF8Jw5Gqxuxgn5AxiCKTGZDMj";
                txid = bintools.cb58Decode(id);
                outputidx = avalanche_1.Buffer.alloc(4);
                outputidx.writeIntBE(0, 0, 4);
                assetidBuf = bintools.cb58Decode(avaxAssetID);
                secpTransferInput = new avm_2.SECPTransferInput(new avalanche_1.BN(.689 * constants_1.BNSCALE));
                secpTransferInput.addSignatureIdx(0, xchain.parseAddress(mwallet.getAddressX()));
                input = new avm_2.TransferableInput(txid, outputidx, assetidBuf, secpTransferInput);
                console.log("constructing my output");
                secpTransferOutput = new avm_2.SECPTransferOutput(new avalanche_1.BN(.688 * constants_1.BNSCALE), outputaddressBuf);
                output = new avm_2.TransferableOutput(assetidBuf, secpTransferOutput);
                baseTx = new avm_2.BaseTx(5, networkData.xchainidBuf, [output], [input]);
                unsignedTx = new avm_2.UnsignedTx(baseTx);
                txbuff = unsignedTx.toBuffer();
                mwallet.resetHdIndices();
                return [4 /*yield*/, mwallet.signX(unsignedTx)];
            case 3:
                tx = _a.sent();
                standardTx = new avm_1.Tx();
                standardTx.fromString(tx.toString());
                xchain.issueTx(standardTx);
                return [2 /*return*/];
        }
    });
}); };
var args = process.argv.slice(2);
//test(parseInt(args[0]))
test(5);
