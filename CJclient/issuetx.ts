import {
    Avalanche,
    BinTools,
    Buffer,
    BN
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


import { generatekeychain, generatexchain } from "./avalancheutils"


const bintools: BinTools = BinTools.getInstance()

const issuetx = async(data: any, networkID: number): Promise<any> => {
    const networkData = generatexchain(networkID)

    console.log("issuing tx")
    console.log("reconstructing unsignedtx")
    const unsignedTx: UnsignedTx = new UnsignedTx()
    unsignedTx.fromBuffer(Buffer.from(data["transaction"]))
    
    console.log("creating credental array")
    let credentialArray: SECPCredential[] = []
    data["signatures"].forEach((sig: any) => {
        const sigitem: Signature = new Signature()
        const sigbuf = Buffer.from(sig[0])
        sigitem.fromBuffer(sigbuf)
        const cred: SECPCredential = new SECPCredential([sigitem])
        credentialArray.push(cred)
    })
    
    console.log("constructing and issuing tx")
    const tx: Tx = new Tx(unsignedTx, credentialArray)
    
    console.log("input total:" + unsignedTx.getInputTotal(bintools.cb58Decode(Defaults.network[networkID].X.avaxAssetID)).toNumber())
    console.log("output total:" + unsignedTx.getOutputTotal(bintools.cb58Decode(Defaults.network[networkID].X.avaxAssetID)).toNumber())

    const id: string = await networkData.xchain.issueTx(tx) 

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await networkData.xchain.getTxStatus(id)
    }
    console.log(status)

}

export { issuetx }