//sings the wtx from the join

import {
    Buffer,
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { 
    TransferableInput,
    TransferableOutput,
    UnsignedTx,
    UTXOSet,
    UTXO,
 } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"
import { Signature } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common"
import { send_recieve } from "./processmessage"
import { createHash } from "crypto"
import { generate_key_chain, generate_xchain, get_key_type } from "../avalancheutils"
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk"
import * as consts from "./constants"
import { issuetx} from "./issuestx"

//checks for any information that may put the user at risk, and if true, signs the tx and sends it back to the server
const send_signature = async(join_ID: number, data: any, pub_addr: string, private_key: string, network_ID: number,
    ip: string, my_input?: TransferableInput, my_output?: TransferableOutput): Promise<any> => {

    const network_data = generate_xchain(network_ID)
    const key_type = get_key_type(private_key)

    //reconstruct the wtx
    const tx_buf: Buffer = Buffer.from(data)
    const unsigned_tx: UnsignedTx = new UnsignedTx()
    unsigned_tx.fromBuffer(tx_buf)

    //get the inputs and outputs from the tx
    const inputs: TransferableInput[] = unsigned_tx.getTransaction().getIns()
    const outputs: TransferableOutput[] = unsigned_tx.getTransaction().getOuts()
    
    const msg = Buffer.from(createHash("sha256").update(tx_buf).digest())

    //initialize the signature data
    const sig: Signature = new Signature()
    if (key_type == 0){ //private_keys

        //get all the utxo data that the user has
        const key_data = generate_key_chain(network_data.xchain, private_key)
        const utxo_set: UTXOSet = (await network_data.xchain.getUTXOs(pub_addr)).utxos
        const my_utxos: UTXO[] = utxo_set.getAllUTXOs()

        //run security checks on the wtx, making sure there are no bad actors at play
        if (run_security_checks(inputs, outputs, my_input, my_output, my_utxos)) {

            //if security checks are good, sign
            const sig_buf = key_data.my_key_pair.sign(msg)
            sig.fromBuffer(sig_buf)
        }
        else {
            throw new Error("did not pass security checks, server or coinjoin may have dropped your information or is malicious")
        }
    }
    else if (key_type == 1){
        const my_wallet = MnemonicWallet.fromMnemonic(private_key)
        await my_wallet.resetHdIndices()
        await my_wallet.updateUtxosX()
        const my_key = my_wallet.getKeyChainX().getKey(network_data.xchain.parseAddress(pub_addr))

        //run security chekcs on the wtx, making sure there are no bad actors at play
        if (run_security_checks(inputs, outputs, my_input, my_output, my_wallet.utxosX.getAllUTXOs())) {

            //if security checks are good, sign
            const sig_buf = my_key.sign(msg)
            sig.fromBuffer(sig_buf)
        }
        else {
            throw new Error("did not pass security checks, server or coinjoin may have dropped your information or is malicious")
        }
    }

    //data to send back to the cj server
    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.COLLECT_SIGS,
        "sig": sig.toBuffer(),
        "pub_addr": pub_addr,
    }

    //send the signature.  Once all signatures are collected, if the server does not issue in a timely manner issue it manually
    const return_data = (await send_recieve(send_data, ip))
    if (return_data.length == 1){
        console.log("server did not issue in a timely manner, manually issuing tx")
        issuetx(return_data[0], network_ID)
    }
    else {
        console.log(`server succesfully issued tx of id ${return_data[1]}`)
    }
}

//check inputs to make sure the client's input is included, and none of their other inputs are included as well
const check_inputs = function(inputs: TransferableInput[], my_input: TransferableInput, my_utxos: UTXO[]){
    let has_input: boolean = false
    for (let i = 0; i < inputs.length; i++){
        const check_item: TransferableInput = inputs[i]

        //check if the inputs contain the client's input
        if (check_item.getTxID().equals(my_input.getTxID()) && check_item.getOutputIdx().equals(my_input.getOutputIdx())){
            has_input = true
        }
        else {
            //check if the inputs contain any of the client's other inputs
            for (let j = 0; j < my_utxos.length; j++){
                const test_utxo: UTXO = my_utxos[j]
                if (check_item.getTxID().equals(test_utxo.getTxID()) && check_item.getOutputIdx().equals(test_utxo.getOutputIdx())){
                    return false
                }
            }
        }
    }
    if (!has_input){
        return false
    }
    return true
}

//check outputs to make sure the client's output is included
const check_outputs = function(outputs: TransferableOutput[], my_output: TransferableOutput){
    let has_output: boolean = false

    //check if the outputs contains the client's output
    for (let i = 0; i < outputs.length; i++){
        const check_item: TransferableOutput = outputs[i]
        if (check_item.toBuffer().equals(my_output.toBuffer())){
            has_output = true
        }
    }
    if (!has_output){
        return false
    }
    return true
}

//run security checks on inputs and outputs
const run_security_checks = function(inputs: TransferableInput[], outputs: TransferableOutput[], 
    my_input: TransferableInput, my_output: TransferableOutput, my_utxos: UTXO[]){
    const inputs_check = check_inputs(inputs, my_input, my_utxos)
    const outputs_check = check_outputs(outputs, my_output)
    return (inputs_check && outputs_check)
}

export { send_signature }