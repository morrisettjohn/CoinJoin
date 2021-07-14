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
var sendutxodata_1 = require("../sendutxodata");
var utils_1 = require("avalanche/dist/utils");
var pubaddr1S = "X-fuji13a3dm204mh9hfjx3ajpk33cchgszh2qry97ml9";
var privatekey1S = "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2";
var pubaddr2S = "X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443";
var privatekey2S = "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY";
var pubaddr3S = "X-fuji10a7tx3xl2cyp3g60d68zh80tzen0lwxd548u82";
var privatekey3S = "PrivateKey-7f84zwffkNTAjKu1DDDrRBafWq2wE3GxZ3t7EYVFR8fTpJArc";
var pubaddr4S = "X-fuji1408364q97l7x6hjjqdmkjl09hjn5r3uyqwfa9l";
var privatekey4S = "PrivateKey-Wt2ztXTUVj4bcMyuQtxRGCMXJmGH17rC7J8kQQvCnGxgZDyxv";
var pubaddr1R = "X-fuji1ywknekcr6rkekg9g996dsnsdg20wmvwhpsmup6";
var privatekey1R = "PrivateKey-ji3ENE83u1451cu8GCaL1mHYdn9tDUL2L8hJtEHsTSJNVEnbd";
var pubaddr2R = "X-fuji1tunzyk0v8fw5ee73uzdedrtunf26936fy9wg48";
var privatekey2R = "PrivateKey-24Nw3joRD8WVV4nviVTVpQcMGWX7Mg3DkYFY2NKcqDZbCRzXpC";
var pubaddr3R = "X-fuji12jwy0ctuankcamu0qv0dcy95pxsr578ju7t7qe";
var privatekey3R = "PrivateKey-2iSH7BA88LF5mozMd2cRmkFdGHQdksMRnmQADhWPfGhNFRPiii";
var pubaddr4R = "X-fuji1ga8cr9eu7fq9x6f7zvwq26xmm4vdmdg7zrveav";
var privatekey4R = "PrivateKey-28895VhkPjCeVwj8eThqMeFrCX4A44LucRbU9pSBucd1x4LnvT";
var wallet1 = "dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing";
var test1S = [pubaddr1S, privatekey1S];
var test2S = [pubaddr2S, privatekey2S];
var test3S = [pubaddr3S, privatekey3S];
var test4S = [pubaddr4S, privatekey4S];
var test1R = [pubaddr1R, privatekey1R];
var test2R = [pubaddr2R, privatekey2R];
var test3R = [pubaddr3R, privatekey3R];
var test4R = [pubaddr4R, privatekey4R];
var test1W = [undefined, wallet1];
var tests = {
    "1S": test1S,
    "2S": test2S,
    "3S": test3S,
    "4S": test4S,
    "1R": test1R,
    "2R": test2R,
    "3R": test3R,
    "4R": test4R,
    "1W": test1W
};
var networkID = 5;
var avaxAssetID = utils_1.Defaults.network[networkID].X.avaxAssetID;
var inputamount = 1.15;
var outputamount = 1;
//usage:  node test.js *joinid (number)* *fromaddr* *toaddr* *inputamount?* *outputamount?*
var args = process.argv.slice(2);
var joinid = parseInt(args[0]);
var fromaddr = tests[args[1]];
var toaddr = tests[args[2]];
var networkid = parseInt(args[3]);
if (args.length > 4) {
    inputamount = parseInt(args[4]);
}
if (args.length > 5) {
    outputamount = parseInt(args[5]);
}
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var txdata;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(args[0] == "help")) return [3 /*break*/, 1];
                console.log("usage: node txtest.js *joinid* *fromaddr* *toaddr* *networkid* *inputamount?* *outputamount?* ");
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, sendutxodata_1.sendutxodata(joinid, avaxAssetID, inputamount, outputamount, toaddr[0], fromaddr[0], fromaddr[1], networkid)];
            case 2:
                txdata = _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
main();
