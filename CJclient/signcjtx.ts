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
import { request_wtx } from "./requestwtx";

const bintools: BinTools = BinTools.getInstance()

const sign_cj_tx = async(join_ID: number, private_key: string, ip: string): Promise<any> => {
    const join_params = await get_join_data(join_ID, ip)
    const network_ID = join_params["network_ID"]
    const join_tx_ID = join_params["join_tx_ID"]
    const server_addr = join_params["fee_addr"]
    

    const log_data = get_all_logs()
    const tx_data = get_join_tx_data(log_data, server_addr, join_tx_ID)
    const pub_addr = await get_pub_addr_from_tx(log_data, server_addr, join_tx_ID, private_key)
    const pub_addr_log = get_log_from_pub_key(log_data, server_addr, join_tx_ID, pub_addr)

    const wtx = (await request_wtx(join_ID, private_key, pub_addr, network_ID, ip))[0]

    

    const input = new TransferableInput()
    const output = new TransferableOutput()
    input.fromBuffer(bintools.cb58Decode(pub_addr_log["input"]))
    output.fromBuffer(bintools.cb58Decode(pub_addr_log["output"]))

    console.log(wtx, input, output)

    await send_signature(join_ID, wtx, pub_addr, private_key, network_ID, ip, input, output)
}

export { sign_cj_tx }