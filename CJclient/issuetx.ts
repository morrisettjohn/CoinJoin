import {
    Avalanche,
    BinTools,
    Buffer,
    BN
  } from "avalanche" 
import { 
    AVMAPI,
    UTXOSet,
    TransferableInput,
    TransferableOutput,
    KeyChain,
    SECPTransferInput,
    SECPTransferOutput,
    BaseTx,
    UnsignedTx,
 } from "avalanche/dist/apis/avm"
import { PlatformVMAPI, SECPCredential } from "avalanche/dist/apis/platformvm"
import { Credential, Signature, StandardBaseTx } from "avalanche/dist/common"
import { request } from "http"
 import {
     Defaults
 }from "avalanche/dist/utils"
import { Address } from "avalanche/src/common"
import { Tx } from "avalanche/dist/apis/avm/tx"


const bintools: BinTools = BinTools.getInstance()
const Ip: string = "api.avax-test.network"
const networkID: number = 5
const port: number = 443
const protocol: string = "https"
const xchainid: string = Defaults.network[networkID].X.blockchainID
const xchainidBuf: Buffer = bintools.cb58Decode(xchainid)
const avax: Avalanche = new Avalanche(Ip, port, protocol, networkID, xchainid);
avax.setRequestConfig('withCredentials', true)
const xchain: AVMAPI = avax.XChain();

const issuetx = async(data: any): Promise<any> => {
    console.log("issuing tx")  //XXX each signature should be its own credential
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

    const id: string = await xchain.issueTx(tx) 

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await xchain.getTxStatus(id)
    }
    console.log(status)

}

export { issuetx }