import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { request_nonce } from "./requestnonce";
import { get_key_type } from "./avalancheutils";

const exit_cj = async(join_ID: number, network_ID: number, pub_addr: string, private_key: string): Promise<any> => {

    const key_type = get_key_type(private_key)
    console.log(network_ID)

    const ticket = await request_nonce(join_ID, pub_addr, private_key, network_ID)
    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.EXIT,
        "pub_addr": pub_addr,
        "ticket": ticket,
    }

    console.log("sending data to coinjoin server now")
    await send_recieve(send_data)
}

export { exit_cj }