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
var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var mnemonicKey = "dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing";
var bintools = avalanche_1.BinTools.getInstance();
var test = function (networkID) { return __awaiter(void 0, void 0, void 0, function () {
    var networkData, keyData, xchain, q, u, output_idx, asset_ID, secpinput, input, tx, x, z, v, utxo, y, n, b, e;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                networkData = avalancheutils_1.generate_xchain(5);
                keyData = avalancheutils_1.generate_key_chain(networkData.xchain, "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY");
                xchain = networkData.xchain;
                q = "MtyBi5hmr3Xan22cQcJ4a6E4Bd3i9hZiv4rC9dw9KYFpdoyGG";
                u = "2GBGr6CdKFpoDzd7YiS3Vu8XpRjUCqcxHvQ7EKTZBwy3zE8Gv2";
                output_idx = avalanche_1.Buffer.alloc(4);
                output_idx.writeIntBE(1, 0, 4);
                return [4 /*yield*/, xchain.getAVAXAssetID()];
            case 1:
                asset_ID = _a.sent();
                secpinput = new avm_1.SECPTransferInput(new avalanche_1.BN(1.01));
                input = new avm_1.TransferableInput(bintools.cb58Decode(u), output_idx, asset_ID, secpinput);
                tx = new avm_1.Tx();
                return [4 /*yield*/, networkData.xchain.getTx("2GBGr6CdKFpoDzd7YiS3Vu8XpRjUCqcxHvQ7EKTZBwy3zE8Gv2")];
            case 2:
                x = _a.sent();
                tx.fromString(x);
                z = tx.getUnsignedTx().getTransaction().getIns()[0].getUTXOID();
                v = tx.getUnsignedTx().getTransaction().getIns()[0].getTxID();
                utxo = "E3uDJkVNtkH1Byoj7LPANd8mhXXtHq2WJodxRAL9wDvoYNz8a";
                return [4 /*yield*/, networkData.xchain.getUTXOs("X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443")];
            case 3:
                y = (_a.sent()).utxos;
                n = y.getAllUTXOs();
                b = y.getAllUTXOStrings();
                e = y.getUTXO(input.getUTXOID());
                console.log(y.includes(e));
                console.log(input.getUTXOID());
                return [2 /*return*/];
        }
    });
}); };
var args = process.argv.slice(2);
//test(parseInt(args[0]))
test(5);
