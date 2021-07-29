import { sendutxodata } from "../sendutxodata";
import { Defaults } from "avalanche/dist/utils";
import { processMessage } from "../processmessage";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";
import { startCJInstance } from "../cjinstance";
import { tests, wtests } from "./testaddrs";


const networkID = 5
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
let assetID = avaxAssetID
let inputamount = 1.15
let outputamount = 1

//usage:  node test.js *joinid (number)* *fromaddr* *toaddr* *inputamount?* *outputamount?*
const args = process.argv.slice(2)
const joinid = parseInt(args[0])



let fromaddr = undefined
let toaddr = undefined

if (args[1] in tests){
  fromaddr = tests[args[1]]
}
else if (args[1] in wtests){
  fromaddr = wtests[args[1]]
}

if (args[2] in tests){
  toaddr = tests[args[2]]
}
else if (args[2] in wtests){
  toaddr = tests[args[2]]
}


const networkid = parseInt(args[3])

if (args.length > 4){
  inputamount = parseFloat(args[4])
}
if (args.length > 5){
  outputamount = parseFloat(args[5])
}
if (args.length > 6){
  assetID = args[6]
}

const main = async(): Promise<any> => {
  if (args[0] == "help"){
    console.log("usage: node txtest.js *joinid* *fromaddr* *toaddr* *networkid* *inputamount?* *outputamount?* *assetID?*")
  } 
  else {
    startCJInstance(joinid, assetID, inputamount, outputamount, toaddr[0], fromaddr[0], fromaddr[1], networkid)
  }
}
main()