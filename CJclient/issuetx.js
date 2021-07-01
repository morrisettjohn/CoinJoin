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
exports.issuetx = void 0;
var avalanche_1 = require("avalanche");
var avm_1 = require("avalanche/dist/apis/avm");
var platformvm_1 = require("avalanche/dist/apis/platformvm");
var common_1 = require("avalanche/dist/common");
var utils_1 = require("avalanche/dist/utils");
var tx_1 = require("avalanche/dist/apis/avm/tx");
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
var issuetx = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var unsignedTx, credentialArray, tx, id, status;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("issuing tx"); //XXX each signature should be its own credential
                console.log("reconstructing unsignedtx");
                unsignedTx = new avm_1.UnsignedTx();
                unsignedTx.fromBuffer(avalanche_1.Buffer.from(data["transaction"]));
                console.log("creating credental array");
                credentialArray = [];
                data["signatures"].forEach(function (sig) {
                    var sigitem = new common_1.Signature();
                    var sigbuf = avalanche_1.Buffer.from(sig[0]);
                    sigitem.fromBuffer(sigbuf);
                    var cred = new platformvm_1.SECPCredential([sigitem]);
                    credentialArray.push(cred);
                });
                console.log("constructing and issuing tx");
                tx = new tx_1.Tx(unsignedTx, credentialArray);
                console.log("input total:" + unsignedTx.getInputTotal(bintools.cb58Decode(utils_1.Defaults.network[networkID].X.avaxAssetID)).toNumber());
                console.log("output total:" + unsignedTx.getOutputTotal(bintools.cb58Decode(utils_1.Defaults.network[networkID].X.avaxAssetID)).toNumber());
                return [4 /*yield*/, xchain.issueTx(tx)];
            case 1:
                id = _a.sent();
                status = "";
                _a.label = 2;
            case 2:
                if (!(status != "Accepted" && status != "Rejected")) return [3 /*break*/, 4];
                return [4 /*yield*/, xchain.getTxStatus(id)];
            case 3:
                status = _a.sent();
                return [3 /*break*/, 2];
            case 4:
                console.log(status);
                return [2 /*return*/];
        }
    });
}); };
exports.issuetx = issuetx;
