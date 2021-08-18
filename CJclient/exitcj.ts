import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { request_nonce } from "./requestnonce";
import { get_key_type } from "./avalancheutils";
import { get_join_data } from "./getjoindata";
import { generate_xchain } from "./avalancheutils";
import { generate_key_chain } from "./avalancheutils";
import { get_all_logs, get_join_tx_data, get_log_from_priv_key, get_log_from_pub_key, get_pub_addr_from_tx} from "./logs";

const exit_cj = async(ip: string, join_ID: number, private_key: string): Promise<any> => {

    const join_params = await get_join_data(join_ID, ip)
    const network_ID = join_params["network_ID"]
    const join_tx_ID = join_params["join_tx_ID"]
    const server_addr = join_params["fee_addr"]

    const log_data = get_all_logs()
    const tx_data = get_join_tx_data(log_data, server_addr, join_tx_ID)
    const pub_addr = await get_pub_addr_from_tx(log_data, server_addr, join_tx_ID, private_key)

    const nonce_sig_pair = await request_nonce(join_ID, pub_addr, private_key, network_ID, ip)
    const nonce = nonce_sig_pair[0]
    const nonce_sig = nonce_sig_pair[1]

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