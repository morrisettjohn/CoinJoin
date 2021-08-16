import { exit_cj } from "./exitcj"
import { find_matching_joins } from "./findmatchingjoins";
import { get_join_data } from "./getjoindata";
import { get_option_data } from "./getoptiondata"
import { full_cj_tx } from "./cjtxtypes";
import { join_data_readable } from "./utils";
import { record_address } from "./addr/recordaddress";
import { get_address_data } from "./addr/getaddrdata";
import { remove_address } from "./addr/removeaddr";

const JOIN = "join"
const OPTIONS = "get_options"
const JOININFO = "join_info"
const SEARCH = "search"
const EXIT = "exit"
const INFO = "info"
const RECORD = "record"
const ADDRS = "addrs"
const REM_ADDR = "rem_addr"
const commands = [JOIN, OPTIONS, JOININFO, SEARCH, EXIT, INFO, RECORD, ADDRS, REM_ADDR]

const STD_USAGE = "usage: node coinjoin"
const DESC = "description: "
const HELP = "help"

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
    else if (command == RECORD){
      cmd_record_address()
    }
    else if (command == ADDRS){
      cmd_print_recorded_addrs()
    }
    else if (command == REM_ADDR){
      cmd_remove_address()
    }
    else{
      console.log(`${command} is not a valid command, here is a list of valid commands\n`)
      cmd_help()
    }
}

const cmd_help = function(){
  console.log("run 'node coinjoin (command) info' for more information\n")
  commands.forEach(item => {
    console.log(`\t-${item}`)
  })
  console.log("")
}

const cmd_record_address = function(){
  if (args[0] == INFO || args[0] == HELP){
    console.log(`${DESC} locally stores a private key with a username for easy access`)
    console.log(`${STD_USAGE} ${RECORD} (private key) (username)`)
  } 
  else {
    const addr_string: string = args[0]
    const username: string = args[1]
    record_address(addr_string, username)
  }
}

const cmd_remove_address = function(){
  if (args[0] == INFO || args[0] == HELP){
    console.log(`${DESC} removes one of the locally stored keys.  Use node coinjoin addrs to get a list of stored addresses`)
    console.log(`${STD_USAGE} ${REM_ADDR} (username)`)
  }
  else {
    const remove_item: string = args[0]
    remove_address(remove_item)
  }
}

const cmd_print_recorded_addrs = function(){
  if (args[0] == INFO || args[0] == HELP){
    console.log(`${DESC} prints all stored private keys along with their usernames`)
    console.log(`${STD_USAGE} ${ADDRS}`)
  }
  else {
    const addrs = get_address_data()
    for (let key in addrs){
      console.log(`\t-${key}: ${addrs[key]}`)
    }
  }
}

const cmd_start_cj_instance = async(): Promise<any> => {

  if (args[0] == INFO || args[0] == HELP || args.length == 0){
    console.log(`${DESC} runs a complete transaction from start to finish, I.e. sends a valid input/output to the server and then signs`)
    console.log(`${STD_USAGE} ${JOIN} (ip) (join_ID) (private_key) (dest_addr) [input_amount]`)
  } else {
    const ip = args[0]
    const join_ID = parseInt(args[1])
    let private_key = args[2]
    const dest_addr = args[3]
    const input_amount = parseFloat(args[4])


    const address_data = get_address_data()
    if (private_key in address_data) {
      private_key = address_data[private_key]
    }
    full_cj_tx(join_ID, private_key, dest_addr, ip, input_amount)
  }
}

const cmd_get_option_data = function(){
  if (args[0] == INFO || args[0] == HELP){
    console.log(`${DESC} gets the cj server's options for coinjoins, e.g. assetid/name, denominations, etc`)
    console.log(`${STD_USAGE} ${OPTIONS} (ip)`)
  } else {
    const ip = args[0]
    get_option_data(ip)
  }
}

const cmd_print_join_data = async() => {
  if (args[0] == INFO || args[0] == HELP){
    console.log(`${DESC} gets the data for a specific join that is in the CJ server.`)
    console.log(`${STD_USAGE} ${JOININFO} (ip) (join_id)`)
  } else {
    const ip = args[0]
    const join_ID = parseInt(args[1])
    const join_data = (await get_join_data(join_ID, ip))
    console.log(join_data_readable(join_data))
  }
}

const cmd_find_matching_joins = async() => {
    const ip = args[0]
    const asset_ID = args[1]
    const asset_amount = parseFloat(args[2])
    const network_ID = parseInt(args[3])
    const min_users = parseInt(args[4])
    const max_users = parseInt(args[5])

    if (args[0] == INFO || args[0] == HELP){
        console.log(`${DESC} runs the matchmaking service on the CJ server with given paramaters, and returns back applicable joins`)
        console.log(`${STD_USAGE} ${SEARCH} (ip) (assetid | name) (targetamount) (networkID) [min_users] [max_users]`)
    } 
    else {
        const join_list = (await find_matching_joins(asset_ID, asset_amount, network_ID, ip, min_users, max_users))
        let join_data = ""
        join_list.forEach(item => {
          join_data += join_data_readable(item)
        })
        console.log(join_data)
    }
}

const cmd_exit_cj = function() {

    const ip = args[0]
    const join_ID = parseInt(args[1])
    let private_key = args[2]
    const address_data = get_address_data()

    if (private_key in address_data) {
      private_key = address_data[private_key]
    }
    
    if (args[0] == INFO || args[0] == HELP){
        console.log(`${DESC} exits a particular coinjoin by signing a nonce.`)
        console.log(`NOTE: if you have signed in to a join with multiple addresses (not recommended), you MUST enter your private key to determine which address you used.`)
        console.log(`${STD_USAGE} ${EXIT} (ip) (join_ID) [priv_key]`)
    } 
    else {
        exit_cj(ip, join_ID, private_key)
    }
}

main()