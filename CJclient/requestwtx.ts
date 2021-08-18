import { BinTools } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { request_nonce } from "./requestnonce";
import { get_key_type } from "./avalancheutils";
import { get_join_data } from "./getjoindata";
import { generate_xchain } from "./avalancheutils";
import { generate_key_chain } from "./avalancheutils";
import { get_all_logs, get_join_tx_data, get_log_from_priv_key, get_log_from_pub_key, get_pub_addr_from_tx} from "./logs";
import { send_signature } from "./sendsignature";
import { TransferableInput, TransferableOutput } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm";

const bintools: BinTools = BinTools.getInstance()

const request_wtx = async(join_ID: number, private_key: string, pub_addr: string, network_ID: number, ip: string): Promise<any> => {

    const nonce_sig_pair = await request_nonce(join_ID, pub_addr, private_key, network_ID, ip)
    const nonce = nonce_sig_pair[0]
    const nonce_sig = nonce_sig_pair[1]

    const send_data = {
        "message_type": consts.REQUEST_WTX,
        "join_ID": join_ID,
        "pub_addr": pub_addr,
        "nonce": nonce,
        "nonce_sig": nonce_sig
    }

    const wtx = await send_recieve(send_data, ip)
    
    return wtx
}

export { request_wtx }