import {
    Avalanche,
    BinTools,
    Buffer,
    BN
  } from "avalanche" 
import { 
    AVMAPI,
    TransferableInput,
    TransferableOutput,
    KeyChain,
    SECPTransferInput,
    SECPTransferOutput,
    BaseTx,
    UnsignedTx,
 } from "avalanche/dist/apis/avm"
import { Signature } from "avalanche/dist/common"
import { request } from "http"
import { Defaults }from "avalanche/dist/utils"
import { processMessage, constructHeaderOptions, sendRecieve } from "./processmessage"
import * as readline from "readline"

import { createHash } from "crypto"

const BNSCALE: number = 1000000000
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
const fee:  BN = xchain.getDefaultTxFee()

const sendsignature = async(joinid: number, data: any, pubaddr: string, privatekey: string, 
    input?: TransferableInput, output?: TransferableOutput): Promise<any> => {
    console.log("try this")
    const inputs: TransferableInput[] = []
    const outputs: TransferableOutput[] = []
    const inputData = data["inputs"]
    const outputData = data["outputs"]

    const xKeyChain: KeyChain = xchain.keyChain();
    const myKeyPair = xKeyChain.importKey(privatekey)
    const myAddressBuf = xchain.keyChain().getAddresses()
    const myAddressStrings = xchain.keyChain().getAddressStrings()

    //construct inputs
    console.log("constructing tx from wiretx")

    console.log("constructing inputs")
    for (let i = 0; i < inputData.length; i++){
        const inputObject = inputData[i]
        const input: TransferableInput = new TransferableInput()
        input.fromBuffer(Buffer.from(inputObject[0]))
        inputs.push(input)
    }
    console.log("checking if my input is in list")
    let myInfo: boolean = false
    for (let i = 0; i < inputs.length; i++){
        const checkItem: TransferableInput = inputs[i]
        if (checkItem.getTxID().equals(input.getTxID()) && checkItem.getOutputIdx().equals(input.getOutputIdx())){
            myInfo = true
        }
    }
    if (!myInfo){
        console.log("my input is not in input list")
        throw Error
    }

    console.log("input is in list")

    //construct outputs
    console.log("constructing outputs")
    for (let i = 0; i < outputData.length; i++){
        const outputObject = outputData[i]
        const output: TransferableOutput = new TransferableOutput()
        output.fromBuffer(Buffer.from(outputObject))
        outputs.push(output)
    }

    console.log("checking if output is in list")
    myInfo = false
    for (let i = 0; i < outputs.length; i++){
        const checkItem: TransferableOutput = outputs[i]
        if (checkItem.toBuffer().equals(output.toBuffer())){
            myInfo = true
        }
    }
    if (!myInfo){
        console.log("my output is not in output list")
        throw Error
    }
    console.log("output is in list")
    
    console.log("constructing transaction")
    const baseTx: BaseTx = new BaseTx (
        networkID,
        bintools.cb58Decode(xchainid),
        outputs,
        inputs,
        Buffer.from("test")
    )
    
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)

    console.log("creating signature")
    const txbuff = unsignedTx.toBuffer()
    const msg = Buffer.from(createHash("sha256").update(txbuff).digest())
    const sigbuf = myKeyPair.sign(msg)
    const sig: Signature = new Signature()
    sig.fromBuffer(sigbuf)

    console.log("transaction signed, sending sig to coinJoin")

    const returnData = {
        "joinid": joinid,
        "messagetype": 4,
        "signature": sig.toBuffer(),
        "pubaddr": pubaddr,
        "transaction": txbuff,
    }

    sendRecieve(returnData)
    
}

export { sendsignature }