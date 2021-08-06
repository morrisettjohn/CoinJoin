import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { request_nonce } from "./requestnonce";
import { get_key_type } from "./avalancheutils";
import { get_join_data } from "./getjoindata";
import { generate_xchain } from "./avalancheutils";
import { generate_key_chain } from "./avalancheutils";

const exit_cj = async(join_ID: number, private_key: string): Promise<any> => {

    const join_params = await get_join_data(join_ID)
    const network_ID = join_params["network_ID"]
    const key_type = get_key_type(private_key)

    const user_list = await get_user_list(join_ID)
    const network_data = generate_xchain(network_ID)

    let pub_addr = undefined
    if (key_type == 0){
        const key_data = generate_key_chain(network_data.xchain, private_key)
        pub_addr = key_data.my_addr_strings[0]
    }
    


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