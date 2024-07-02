//requests the wtx information from the cj server

import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { request_nonce } from "./requestnonce";

const request_wtx = async(join_ID: number, private_key: string, pub_addr: string, network_ID: number, ip: string): Promise<any> => {

    //request a verification nonce
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