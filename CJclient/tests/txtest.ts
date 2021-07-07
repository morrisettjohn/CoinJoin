import { sendutxodata } from "../sendutxodata";
import { Defaults } from "avalanche/dist/utils";
import { processMessage } from "../processmessage";

const pubaddr1S = "X-fuji13a3dm204mh9hfjx3ajpk33cchgszh2qry97ml9"
const privatekey1S = "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2"

const pubaddr2S = "X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443"
const privatekey2S = "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY"

const pubaddr3S = "X-fuji10a7tx3xl2cyp3g60d68zh80tzen0lwxd548u82"
const privatekey3S = "PrivateKey-7f84zwffkNTAjKu1DDDrRBafWq2wE3GxZ3t7EYVFR8fTpJArc"

const pubaddr4S = "X-fuji1408364q97l7x6hjjqdmkjl09hjn5r3uyqwfa9l"
const privatekey4S = "PrivateKey-Wt2ztXTUVj4bcMyuQtxRGCMXJmGH17rC7J8kQQvCnGxgZDyxv"

const pubaddr1R = "X-fuji1ywknekcr6rkekg9g996dsnsdg20wmvwhpsmup6"
const privatekey1R = "PrivateKey-ji3ENE83u1451cu8GCaL1mHYdn9tDUL2L8hJtEHsTSJNVEnbd"

const pubaddr2R = "X-fuji1tunzyk0v8fw5ee73uzdedrtunf26936fy9wg48"
const privatekey2R = "PrivateKey-24Nw3joRD8WVV4nviVTVpQcMGWX7Mg3DkYFY2NKcqDZbCRzXpC"

const pubaddr3R = "X-fuji12jwy0ctuankcamu0qv0dcy95pxsr578ju7t7qe"
const privatekey3R = "PrivateKey-2iSH7BA88LF5mozMd2cRmkFdGHQdksMRnmQADhWPfGhNFRPiii"

const pubaddr4R = "X-fuji1ga8cr9eu7fq9x6f7zvwq26xmm4vdmdg7zrveav"
const privatekey4R = "PrivateKey-28895VhkPjCeVwj8eThqMeFrCX4A44LucRbU9pSBucd1x4LnvT"

const test1S = [pubaddr1S, privatekey1S]
const test2S = [pubaddr2S, privatekey2S]
const test3S = [pubaddr3S, privatekey3S]
const test4S = [pubaddr4S, privatekey4S]
const test1R = [pubaddr1R, privatekey1R]
const test2R = [pubaddr2R, privatekey2R]
const test3R = [pubaddr3R, privatekey3R]
const test4R = [pubaddr4R, privatekey4R]
const tests = {"1S": test1S, "2S": test2S, "3S": test3S, "4S": test4S, "1R": test1R, "2R": test2R, "3R": test3R, "4R": test4R}

const networkID = 5
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
let inputamount = 1.15
let outputamount = 1

//usage:  node test.js *joinid (number)* *fromaddr* *toaddr* *inputamount?* *outputamount?*
const args = process.argv.slice(2)
const joinid = parseInt(args[0])
const fromaddr = tests[args[1]]
const toaddr = tests[args[2]]

if (args.length > 3){
  inputamount = parseInt(args[3])
}
if (args.length > 4){
  outputamount = parseInt(args[4])
}
const main = async(): Promise<any> => {
    const txdata = await sendutxodata(joinid, avaxAssetID, inputamount, outputamount, toaddr[0], fromaddr[0], fromaddr[1])
}
main()