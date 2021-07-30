import {
    BinTools,
    Buffer,
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { 
    UnsignedTx,
    Tx
 } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"
import { SECPCredential } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/platformvm"
import { Signature } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common"

 import {
     Defaults
 }from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/utils"
import { XChainAlias } from "avalanche/dist/utils"

import { generatexchain } from "./avalancheutils"


const bintools: BinTools = BinTools.getInstance()

const issuetx = async(data: any, networkID: number): Promise<any> => {
    const networkData = generatexchain(networkID)
    console.log("issuing tx")

    const stxBuf: Buffer = new Buffer(data)
    const stx: Tx = new Tx()
    stx.fromBuffer(stxBuf)
    const id: string = await networkData.xchain.issueTx(stx) 

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await networkData.xchain.getTxStatus(id)
    }
    console.log(`Tx has been ${status}`)

}



export { issuetx }