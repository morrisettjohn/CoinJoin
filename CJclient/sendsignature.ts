import {
    BinTools,
    Buffer,
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { 
    TransferableInput,
    TransferableOutput,
    BaseTx,
    UnsignedTx,
    UTXOSet,
    UTXO,
 } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"
import { Signature } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common"
import { sendRecieve } from "./processmessage"
import { createHash } from "crypto"
import { generatekeychain, generatexchain, getKeyType } from "./avalancheutils"
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk"
import * as consts from "./constants"
import { requestNonce } from "./requestjoin"


const bintools: BinTools = BinTools.getInstance()

const sendsignature = async(joinid: number, data: any, pubaddr: string, privatekey: string, networkID: number,
    myInput?: TransferableInput, myOutput?: TransferableOutput): Promise<any> => {
    const networkData = generatexchain(networkID)
    const keyType = getKeyType(privatekey)

    const inputs: TransferableInput[] = []
    const outputs: TransferableOutput[] = []

    console.log("constructing inputs")
    for (let i = 0; i < data["inputs"].length; i++){
        const inputObject = data["inputs"][i]
        const input: TransferableInput = new TransferableInput()
        input.fromBuffer(Buffer.from(inputObject[0]))
        inputs.push(input)
    }

    console.log("constructing outputs")
    for (let i = 0; i < data["outputs"].length; i++){
        const outputObject = data["outputs"][i]
        const output: TransferableOutput = new TransferableOutput()
        output.fromBuffer(Buffer.from(outputObject))
        outputs.push(output)
    }

    const baseTx: BaseTx = new BaseTx (
        networkID,
        networkData.xchainidBuf,
        outputs,
        inputs,
        Buffer.from("test")
    )

    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    
    const txbuff = unsignedTx.toBuffer()
    const msg = Buffer.from(createHash("sha256").update(txbuff).digest())


    let sigbuf: Buffer = undefined
    const sig: Signature = new Signature()
    if (keyType == 0){ //privatekeys
        const keyData = generatekeychain(networkData.xchain, privatekey)
        const utxoset: UTXOSet = (await networkData.xchain.getUTXOs(pubaddr)).utxos
        const myUtxos: UTXO[] = utxoset.getAllUTXOs()
        runSecurityChecks(inputs, outputs, myInput, myOutput, myUtxos)
        sigbuf = keyData.myKeyPair.sign(msg)
        sig.fromBuffer(sigbuf)
    }
    else if (keyType == 1){
        const mwallet = MnemonicWallet.fromMnemonic(privatekey)
        await mwallet.resetHdIndices()
        await mwallet.updateUtxosX()
        runSecurityChecks(inputs, outputs, myInput, myOutput, mwallet.utxosX.getAllUTXOs())

        const sigString = mwallet.getSigFromUTX(msg, mwallet.getAllAddressesX().indexOf(pubaddr))
        
        sig.fromBuffer(sigString)
    }

    const ticket = await requestNonce(joinid, pubaddr, privatekey, networkID)
    console.log("transaction signed, sending sig to coinJoin")

    const sendData = {
        "joinid": joinid,
        "messagetype": consts.COLLECT_SIGS,
        "signature": sig.toBuffer(),
        "pubaddr": pubaddr,
        "transaction": txbuff,
        "ticket": ticket,
    }

    const recievedData = await sendRecieve(sendData)
    return recievedData
}

const checkInputs = function(inputs: TransferableInput[], myInput: TransferableInput, myUtxos: UTXO[]){
    let hasInput: boolean = false
    let unwantedUTXOcount: number = 0
    for (let i = 0; i < inputs.length; i++){
        const checkItem: TransferableInput = inputs[i]
        if (checkItem.getTxID().equals(myInput.getTxID()) && checkItem.getOutputIdx().equals(myInput.getOutputIdx())){
            hasInput = true
        }
        else {
            for (let j = 0; j < myUtxos.length; j++){
                const testutxo: UTXO = myUtxos[j]
                if (checkItem.getTxID().equals(testutxo.getTxID()) && checkItem.getOutputIdx().equals(testutxo.getOutputIdx())){
                    unwantedUTXOcount++
                    break
                }
            }
        }
    }
    if (!hasInput){
        throw Error("Your input is not recorded in the transaction, server or coinjoin participants may be malicious")
    }
    if (unwantedUTXOcount > 0){
        throw Error(unwantedUTXOcount + " other utxo(s) that you own were recorded in the tx.  Serer or cj participants may be malicious")
    }
}

const checkOutputs = function(outputs: TransferableOutput[], myOutput: TransferableOutput){
    let hasOutput: boolean = false
    for (let i = 0; i < outputs.length; i++){
        const checkItem: TransferableOutput = outputs[i]
        if (checkItem.toBuffer().equals(myOutput.toBuffer())){
            hasOutput = true
        }
    }
    if (!hasOutput){
        throw Error("Your output is not recorded in the transaction, server or coinjoin participants may be malicious")
    }
}

const runSecurityChecks = function(inputs: TransferableInput[], outputs: TransferableOutput[], 
    myInput: TransferableInput, myOutput: TransferableOutput, myUtxos: UTXO[]){
    checkInputs(inputs, myInput, myUtxos)
    checkOutputs(outputs, myOutput)
    console.log("All checks run, tx is good")
}

export { sendsignature }