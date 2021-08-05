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
    const join_ID = parseInt(args[0])
    let private_key = undefined
    let dest_addr = undefined
    let input_amount = undefined
    if (args.length == 26 || args.length == 27){
      const key_list = args.slice(1, 25)
      private_key = ""
      key_list.forEach(item => {
        private_key += item + " "
      })
      dest_addr = args[25]
      input_amount = parseFloat(args[26])
    }
    else if (args.length == 3 || args.length == 4) {


      private_key = args[1]
      dest_addr = args[2]
      input_amount = parseFloat(args[3])
    }
    const address_data = get_address_data()
    if (private_key in address_data) {
      private_key = address_data[private_key]
    }

    if (args[0] == INFO || args[0] == HELP){
      console.log(`${DESC} runs a complete transaction from start to finish, I.e. sends a valid input/output to the server and then signs`)
      console.log(`${STD_USAGE} ${JOIN} (join_ID) (private_key) (dest_addr) [input_amount]`)
    } 
    else {
      full_cj_tx(join_ID, private_key, dest_addr, input_amount)
    }
}

const cmd_get_option_data = function(){
  if (args[0] == INFO || args[0] == HELP){
    console.log(`${DESC} gets the cj server's options for coinjoins, e.g. assetid/name, denominations, etc`)
    console.log(`${STD_USAGE} ${OPTIONS}`)
  } else {
    get_option_data()
  }
}

const cmd_print_join_data = async() => {
  if (args[0] == INFO || args[0] == HELP){
    console.log(`${DESC} gets the data for a specific join that is in the CJ server.`)
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
    if (args[0] == INFO || args[0] == HELP){
        console.log(`${DESC} runs the matchmaking service on the CJ server with given paramaters, and returns back applicable joins`)
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


    if (args[0] == INFO || args[0] == HELP){
        console.log(`${DESC} exits a particular coinjoin by signing a nonce`)
        console.log(`${STD_USAGE} ${EXIT} (join_ID) (networkID) (testkeypair / privatekey) (pubkey)`)
    } 
    else {
        exit_cj(join_ID, networkID, publickey, privatekey)
    }
}


main()