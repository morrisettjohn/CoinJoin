import {
    BinTools,
    Buffer,
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { 
    Tx
 } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"


import { generate_xchain } from "./avalancheutils"


const bintools: BinTools = BinTools.getInstance()

const issuetx = async(data: any, network_ID: number): Promise<any> => {
    const network_data = generate_xchain(network_ID)
    console.log("issuing tx")

    const stx_buf: Buffer = new Buffer(data)
    const stx: Tx = new Tx()
    stx.fromBuffer(stx_buf)
    const id: string = await network_data.xchain.issueTx(stx) 

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await network_data.xchain.getTxStatus(id)
    }
    console.log(`Tx has been ${status}`)

}



export { issuetx }