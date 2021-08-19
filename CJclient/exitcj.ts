//runs the process to exit a cj join

import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { request_nonce } from "./requestnonce";
import { get_join_data } from "./getjoindata";
import { get_all_logs, get_join_tx_data, get_pub_addr_from_tx} from "./logs";

const exit_cj = async(ip: string, join_ID: number, private_key: string): Promise<any> => {

    //get the join parameters from the join
    const join_params = await get_join_data(join_ID, ip)
    const network_ID = join_params["network_ID"]
    const join_tx_ID = join_params["join_tx_ID"]
    const server_addr = join_params["fee_addr"]

    //get the logs from the joinlogs data
    const log_data = get_all_logs()
    const pub_addr = await get_pub_addr_from_tx(log_data, server_addr, join_tx_ID, private_key)

    //request a nonce
    const nonce_sig_pair = await request_nonce(join_ID, pub_addr, private_key, network_ID, ip)
    const nonce = nonce_sig_pair[0]
    const nonce_sig = nonce_sig_pair[1]

    //send the data for an exit request
    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.EXIT,
        "pub_addr": pub_addr,
        "nonce": nonce,
        "nonce_sig": nonce_sig
    }

    console.log("sending data to coinjoin server now")
    await send_recieve(send_data, ip)
}

export { exit_cj }