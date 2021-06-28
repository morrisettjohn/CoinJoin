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


    console.log("in issue phase")  //XXX each signature should be its own credential
    const unsignedTx: UnsignedTx = new UnsignedTx()
    

    unsignedTx.fromBuffer(Buffer.from(data["transaction"]))
    console.log(unsignedTx.getTransaction().getIns()[0].getInput().getSigIdxs())
    const inps: TransferableInput[] = unsignedTx.getTransaction().getIns()
    
    let credentialArray: SECPCredential[] = []
    for (let i = 0; i < inps.length; i++){
        credentialArray.push(undefined)
    }

    console.log("hilo")
    
    data["signatures"].forEach((sig) => {
        const sigitem: Signature = new Signature()
        const sigbuf = Buffer.from(sig[0])
        sigitem.fromBuffer(sigbuf)
        const cred: SECPCredential = new SECPCredential([sigitem])
        for (let i = 0; i < inps.length; i++){
            console.log(inps[i].getInput().getSigIdxs()[0])
            console.log(sig[1])
            if (inps[i].getInput().getSigIdxs()[0] == sig[1]){
                credentialArray[i] = cred
            }
        }
        console.log("got cred")
        console.log(credentialArray)
    })
    


    console.log("constructing and issuing tx")
    const tx: Tx = new Tx(unsignedTx, credentialArray)
    console.log(unsignedTx.getInputTotal(bintools.cb58Decode(Defaults.network[networkID].X.avaxAssetID)).toNumber())
    console.log(unsignedTx.getOutputTotal(bintools.cb58Decode(Defaults.network[networkID].X.avaxAssetID)).toNumber())


    //const id: string = await xchain.issueTx(tx) 

    console.log("issued")
}

export { issuetx }