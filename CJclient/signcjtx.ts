//signs an existing join that the user is a part of

import { BinTools } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { get_join_data } from "./getjoindata";
import { get_all_logs, get_log_from_pub_key, get_pub_addr_from_tx} from "./logs";
import { send_signature } from "./sendsignature";
import { TransferableInput, TransferableOutput } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm";
import { request_wtx } from "./requestwtx";

const bintools: BinTools = BinTools.getInstance()

const sign_cj_tx = async(join_ID: number, private_key: string, ip: string): Promise<any> => {
    //get join params
    const join_params = await get_join_data(join_ID, ip)
    const network_ID = join_params["network_ID"]
    const join_tx_ID = join_params["join_tx_ID"]
    const server_addr = join_params["fee_addr"]
    
    //get the log data that the user has stored
    const log_data = get_all_logs()
    const pub_addr = await get_pub_addr_from_tx(log_data, server_addr, join_tx_ID, private_key)
    const pub_addr_log = get_log_from_pub_key(log_data, server_addr, join_tx_ID, pub_addr)

    //request the wtx information
    const wtx = (await request_wtx(join_ID, private_key, pub_addr, network_ID, ip))[0]

    //reconstruct client's input and output from the logs
    const input = new TransferableInput()
    const output = new TransferableOutput()
    input.fromBuffer(bintools.cb58Decode(pub_addr_log["input"]))
    output.fromBuffer(bintools.cb58Decode(pub_addr_log["output"]))

    //send signature to coinjoin
    await send_signature(join_ID, wtx, pub_addr, private_key, network_ID, ip, input, output)
}

export { sign_cj_tx }