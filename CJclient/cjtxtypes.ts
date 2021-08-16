import { issuetx } from "./issuestx"
import { send_signature } from "./sendsignature"
import { send_input_data } from "./sendinputdata"
import { get_join_data } from "./getjoindata"
import { get_key_type } from "./avalancheutils"


const full_cj_tx = async(join_ID: number, private_key: string, dest_addr: string, ip: string, input_amount?: number): Promise<any> => {
    const join_params = await get_join_data(join_ID, ip)
    const asset_ID = join_params["asset_ID"]
    const output_amount = join_params["output_amount"]
    const network_ID = join_params["network_ID"]
    const join_tx_ID = join_params["join_tx_ID"]
    const server_addr = join_params["fee_addr"]

    if (!input_amount){
        input_amount = join_params["input_amount"]
    }

    const wtx_data = await send_input_data(join_ID, asset_ID, input_amount, output_amount,
        dest_addr, private_key, network_ID, join_tx_ID, server_addr, ip)

    const wtx = wtx_data[0]
    const input = wtx_data[1]
    const output = wtx_data[2]
    const pub_addr = wtx_data[3]
    await send_signature(join_ID, wtx, pub_addr, private_key, network_ID, ip, input, output)

}

export { full_cj_tx }