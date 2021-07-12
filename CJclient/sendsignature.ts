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
    UTXOSet,
    UTXO,
 } from "avalanche/dist/apis/avm"
import { Signature } from "avalanche/dist/common"
import { request } from "http"
import { Defaults, XChainAlias }from "avalanche/dist/utils"
import { processMessage, constructHeaderOptions, sendRecieve } from "./processmessage"
import * as readline from "readline"
import { createHash } from "crypto"
import { generatekeychain, generatexchain } from "./avalancheutils"

const BNSCALE: number = 1000000000
const bintools: BinTools = BinTools.getInstance()

const sendsignature = async(joinid: number, data: any, pubaddr: string, privatekey: string, networkID: number,
    input?: TransferableInput, output?: TransferableOutput): Promise<any> => {
    console.log(networkID)
    const networkData = generatexchain(networkID)
    const keyData = generatekeychain(networkData.xchain, privatekey)
    const utxoset: UTXOSet = (await networkData.xchain.getUTXOs(pubaddr)).utxos
    const myutxos: UTXO[] = utxoset.getAllUTXOs()
    console.log(myutxos)
    
    
    const inputs: TransferableInput[] = []
    const outputs: TransferableOutput[] = []
    const inputData = data["inputs"]
    const outputData = data["outputs"]

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
    let myTxIndex = 0
    for (let i = 0; i < inputs.length; i++){
        const checkItem: TransferableInput = inputs[i]
        if (checkItem.getTxID().equals(input.getTxID()) && checkItem.getOutputIdx().equals(input.getOutputIdx())){
            myInfo = true
            myTxIndex = i
            break
        }
    }
    if (!myInfo){
        console.log("my input is not in input list")
        throw Error
    }

    let hasUnwantedUTXOs: boolean = false
    console.log("checking if any other of my utxos are in the list")
    for (let i = 0; i < inputs.length; i++){
        const checkItem: TransferableInput = inputs[i]
        if (i != myTxIndex){
            for (let j = 0; j < myutxos.length; j++){
                const testutxo: UTXO = myutxos[j]
                if (checkItem.getTxID().equals(testutxo.getTxID()) && checkItem.getOutputIdx().equals(testutxo.getOutputIdx())){
                    hasUnwantedUTXOs = true
                }
            }
        }
    }
    if (hasUnwantedUTXOs){
        console.log("warning: one of your other utxos was included in the input list.  Another participant may be behaving maliciously")
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
        console.log(checkItem)
        if (checkItem.toBuffer().equals(output.toBuffer())){
            myInfo = true
        }
    }
    console.log("checking if any of my other utxos are in this list")

    if (!myInfo){
        console.log("my output is not in output list")
        throw Error
    }
    console.log("output is in list")
    
    console.log("constructing transaction")
    const baseTx: BaseTx = new BaseTx (
        networkID,
        networkData.xchainidBuf,
        outputs,
        inputs,
        Buffer.from("test")
    )
    
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)

    console.log("creating signature")
    const txbuff = unsignedTx.toBuffer()
    const msg = Buffer.from(createHash("sha256").update(txbuff).digest())
    const sigbuf = keyData.myKeyPair.sign(msg)
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

    sendRecieve(returnData, networkID)
    
}

export { sendsignature }