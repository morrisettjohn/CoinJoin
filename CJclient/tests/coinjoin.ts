import { exit_cj } from "../exitcj"
import { tests, wtests } from "./testaddrs";
import { find_matching_joins } from "../findmatchingjoins";
import { get_join_data } from "../getjoindata";
import { get_option_data } from "../getoptiondata"
import { full_cj_tx } from "../cjtxtypes";
import { join_data_readable } from "../utils";
import { Defaults } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/utils";



const JOIN = "join"
const OPTIONS = "get_options"
const JOININFO = "join_info"
const SEARCH = "search"
const EXIT = "exit"
const INFO = "info"
const commands = [JOIN, OPTIONS, JOININFO, SEARCH, EXIT, INFO]

const STD_USAGE = "usage: node coinjoin"
const DESC = "description: "

let args = process.argv.slice(2)
const command = args[0]
args = args.slice(1)

const main = function(){
    if (command == JOIN){
      cmd_start_cj_instance()
    }
    else if (command == OPTIONS){
      cmd_get_option_data()
    }
    else if (command == JOININFO){
      cmd_print_join_data()
    }
    else if (command == SEARCH){
      cmd_find_matching_joins()
    }
    else if (command == EXIT){
      cmd_exit_cj()
    }
    else if (command == INFO){
      cmd_help()
    }
    else{
      console.log(`${command} is not a valid command, here is a list of valid commands\n`)
      cmd_help()
    }
}

const cmd_help = function(){
  console.log("run 'node coinjoin *command* help' for more information")
  commands.forEach(item => {
    console.log(`\t${item}`)
  })
}

const cmd_start_cj_instance = async(): Promise<any> => {
    const join_ID = parseInt(args[0])
    const private_key = args[1]
    const dest_addr = args[2]
    const input_amount = parseFloat(args[3])

    if (args[0] == "help"){
      console.log(`${DESC} runs a complete transaction from start to finish, I.e. sends a valid input/output to the server and then signs\n`)
      console.log(`${STD_USAGE} '${JOIN} (join_ID) (private_key) (dest_addr) [input_amount]'`)
    } 
    else {
      full_cj_tx(join_ID, private_key, dest_addr, input_amount)
    }
}

const cmd_get_option_data = function(){
  if (args[0] == "help"){
    console.log(`${DESC} gets the cj server's options for coinjoins, e.g. assetid/name, denominations, etc\n`)
    console.log(`${STD_USAGE} ${OPTIONS}`)
  } else {
    get_option_data()
  }
}

const cmd_print_join_data = async() => {
  if (args[0] == "help"){
    console.log(`${DESC} gets the data for a specific join that is in the CJ server.\n`)
    console.log(`${STD_USAGE} ${JOININFO} (join_id)`)
  } else {
    const join_data = (await get_join_data(parseInt(args[0])))
    console.log(join_data_readable(join_data))
  }
}

const cmd_find_matching_joins = async() => {
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
        console.log(`${STD_USAGE} ${SEARCH} (assetid | name) (targetamount) (networkID) [min_users] [max_users]`)
    } 
    else {
        const join_list = (await find_matching_joins(args[0], parseInt(args[1]), parseInt(args[2]), min_users, max_users))
        console.log(join_list)
        let join_data = ""
        join_list.forEach(item => {
          join_data += join_data_readable(item)
        })
        console.log(join_data)
    }
}

const cmd_exit_cj = function() {

    const join_ID = parseInt(args[0])
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
        console.log(`${STD_USAGE} ${EXIT} (join_ID) (networkID) (testkeypair / privatekey) (pubkey)`)
    } 
    else {
        exit_cj(join_ID, networkID, publickey, privatekey)
    }
}


main()