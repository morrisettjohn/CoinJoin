import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { request_nonce } from "./requestnonce";
import { get_key_type } from "./avalancheutils";
import { get_join_data } from "./getjoindata";
import { generate_xchain } from "./avalancheutils";
import { generate_key_chain } from "./avalancheutils";

const exit_cj = async(ip: string, join_ID: number, private_key: string): Promise<any> => {

    const join_params = await get_join_data(join_ID, ip)
    //const log = get_log_from_priv_key(join_params["join_tx_ID"], private_key)
    const pub_addr = join_params["pub_addr"]
    const network_ID = join_params["network_ID"]

    const ticket = await request_nonce(join_ID, pub_addr, private_key, network_ID, ip)
    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.EXIT,
        "pub_addr": pub_addr,
        "ticket": ticket,
    }

    console.log("sending data to coinjoin server now")
    await send_recieve(send_data, ip)
}

export { exit_cj }