import { exitcj } from "../exitcj"
import { tests, wtests } from "./testaddrs";
import { findMatchingJoins } from "../findmatchingjoins";
import { getjoindata } from "../getjoindata";
import { getoptiondata } from "../getoptiondata"
import { fullcjtx } from "../cjtxtypes";
import { Defaults } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/utils";


const RUN_COMPLETE_TX = "run_complete_tx"
const OPTIONS = "getoptions"
const JOINDATA = "joindata"
const FINDJOINS = "findjoins"
const EXIT = "exitcj"
const HELP = "help"
const STDUSAGE = "usage: node CJclient.js"
const DESC = "description: "
const commands = [RUN_COMPLETE_TX, OPTIONS, JOINDATA, FINDJOINS, EXIT, HELP]

let args = process.argv.slice(2)
const command = args[0]
args = args.slice(1)

const main = function(){
    if (command == RUN_COMPLETE_TX){
      cmdstartCJInstance()
    }
    else if (command == OPTIONS){
      cmdGetOptionData()
    }
    else if (command == JOINDATA){
      cmdGetJoinData()
    }
    else if (command == FINDJOINS){
      cmdFindMatchingJoin()
    }
    else if (command == EXIT){
      cmdExitCJ()
    }
    else if (command == HELP){
      cmdHelp()
    }
    else{
      console.log(`${command} is not a valid command, here is a list of valid commands\n`)
      cmdHelp()
    }
}

const cmdHelp = function(){
  console.log("run 'node CJclient.js *command* help' for more information")
  commands.forEach(item => {
    console.log(`\t${item}`)
  })
}

const cmdstartCJInstance = async(): Promise<any> => {
    const networkID = 5
    const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
    let assetID = avaxAssetID
    let inputamount = 1.15
    let outputamount = 1
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

    if (args[0] == "help"){
      console.log(`${DESC} runs a complete transaction from start to finish, I.e. sends a valid input/output to the server and then signs\n`)
      console.log(`${STDUSAGE} '${RUN_COMPLETE_TX} *joinid* *fromaddr* *toaddr* *networkid* *inputamount?* *outputamount?* *assetID?*'`)
    } 
    else {
      fullcjtx(joinid, assetID, inputamount, outputamount, toaddr[0], fromaddr[0], fromaddr[1], networkid)
    }
}

const cmdGetOptionData = function(){
  if (args[0] == "help"){
    console.log(`${DESC} gets the cj server's options for coinjoins, e.g. assetid/name, denominations, etc\n`)
    console.log(`${STDUSAGE} ${OPTIONS}`)
  } else {
    getoptiondata()
  }
}

const cmdGetJoinData = function() {
  if (args[0] == "help"){
    console.log(`${DESC} gets the data for a specific join that is in the CJ server.\n`)
    console.log(`${STDUSAGE} ${JOINDATA} *joinid*`)
  } else {
    getjoindata(parseInt(args[0]))
  }
}

const cmdFindMatchingJoin = function() {
    let min_users = undefined
    let max_users = undefined

    if (args.length > 3){
        min_users = parseInt(args[3])
    }
    
    if (args.length > 4){
        max_users = parseInt(args[4])
    }
    if (args[0] == "help"){
        console.log(`${DESC} runs the matchmaking service on the CJ server with given paramaters, and returns back applicable joins\n`)
        console.log(`${STDUSAGE} ${FINDJOINS} *assetid/name* *targetamount* *networkID* *min_users?* *max_users?*`)
    } 
    else {
        findMatchingJoins(args[0], parseInt(args[1]), parseInt(args[2]), min_users, max_users)
    }
}

const cmdExitCJ = function() {

    const joinid = parseInt(args[0])
    const networkID = parseInt(args[1])

    let publickey = undefined
    let privatekey = undefined

    if (args[2] in tests){
        privatekey = tests[args[2]][1]
        publickey = tests[args[2]][0]
    }

    else  if (args[2] in wtests){
            privatekey = wtests[args[2]][1]
            if (args.length < 4){
                throw new Error("not enough args")
            }
            publickey = args[3]
    }
    else {
        privatekey = args[2]
        publickey = args[3]
    }


    if (args[0] == "help"){
        console.log(`${DESC} exits a particular coinjoin by signing a nonce\n`)
        console.log(`${STDUSAGE} ${EXIT} *joinid* *networkID* *testkeypair / privatekey* *pubkey*`)
    } 
    else {
        exitcj(joinid, networkID, publickey, privatekey)
    }
}
main()