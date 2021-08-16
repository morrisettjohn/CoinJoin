import * as fs from "fs"
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk"
import { generate_xchain, generate_key_chain, get_key_type } from "./avalancheutils"
const WEEK_MLS = 604800000
const OLD_LOG_TIME = WEEK_MLS
const log_path = "/home/jcm/Documents/test/CoinJoin/CJclient/joinlogs/logs.json"



export const get_server_join_txs = function (log_data: any, server_addr: string) {
    if (server_addr in log_data) {
        return log_data[server_addr]
    }
    else {
        console.log("server addr does not exist in logs, returning undefined")
        return undefined
    }
}

export const get_join_tx_data = function (log_data: any, server_addr: string, join_tx_ID: string) {
    const join_txs = get_server_join_txs(log_data, server_addr)
    if (join_tx_ID in join_txs){ 
        return join_txs[join_tx_ID]
    }
    else {
        console.log("join tx does not exist under server addr, returning undefined")
        return undefined
    }
}

export const get_join_tx_user_data = function(log_data: any, server_addr: string, join_tx_ID: string, user_addr: string) {
    const join_tx_user_data = get_join_tx_data(log_data, server_addr, join_tx_ID)["users"]
    if (user_addr in join_tx_user_data) {
        return join_tx_user_data[user_addr]
    }
    else {
        console.log("user addr does not exist under join transaction, returning undefined")
        return undefined
    }
}

export const get_log_from_priv_key = function(log_data: any, server_addr: string, join_tx_ID: string, priv_key: string) {
    const key_type = get_key_type(priv_key)
    const join_tx_data = get_join_tx_data(log_data, server_addr, join_tx_ID)

    if (join_tx_data != undefined){
        const network_data = generate_xchain(join_tx_data["network_ID"])

        const user_data = join_tx_data["users"]
        if (key_type == 0) {
            const key_data = generate_key_chain(network_data.xchain, priv_key)
            const addr = key_data.my_addr_strings[0]
            if (addr in user_data) {
                return user_data[addr]
            }
        }
        else if (key_type == 1){
            const my_wallet = MnemonicWallet.fromMnemonic(priv_key)
            my_wallet.getExternalAddressesX().forEach(addr => {
                if (addr in user_data) {
                    return user_data[addr]
                }
            })
        }
        console.log("no public key associated with this private key has a log here")
        return undefined

    } else {
        return undefined
    }

}

export const add_log = function(server_addr: string, join_tx_ID: string, join_tx_data: any, user_addr: string, user_data: any) {
    console.log("logging data")

    try{
        let log_data = get_all_logs()

        if (!(server_addr in log_data)) {
            log_data[server_addr] = {}
        }
        if (!(join_tx_ID in log_data[server_addr])) {
            log_data[server_addr][join_tx_ID] = join_tx_data
        }
        log_data[server_addr][join_tx_ID]["users"][user_addr] = user_data
        
        fs.writeFileSync(log_path, JSON.stringify(log_data))
        console.log("added log to file")
    }
    catch (err) {
        console.log(err)
        console.log("error recording log")
    }

}

export const get_all_logs = function() {
    try {
        const data = JSON.parse(fs.readFileSync(log_path, 'utf8'))
        if (data == "") {
            return {}
        } else {
            return data
        }
    }
    catch (err) {
        console.log("couldn't find")
        return {}
    }
}