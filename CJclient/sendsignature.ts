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
import { send_recieve } from "./processmessage"
import { createHash } from "crypto"
import { generate_key_chain, generate_xchain, get_key_type } from "./avalancheutils"
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk"
import * as consts from "./constants"
import { issuetx} from "./issuestx"


const bintools: BinTools = BinTools.getInstance()

const send_signature = async(join_ID: number, data: any, pub_addr: string, private_key: string, network_ID: number,
    ip: string, my_input?: TransferableInput, my_output?: TransferableOutput): Promise<any> => {
    const network_data = generate_xchain(network_ID)
    const key_type = get_key_type(private_key)

    const tx_buf: Buffer = Buffer.from(data)
    const unsigned_tx: UnsignedTx = new UnsignedTx()
    unsigned_tx.fromBuffer(tx_buf)
    const inputs: TransferableInput[] = unsigned_tx.getTransaction().getIns()
    const outputs: TransferableOutput[] = unsigned_tx.getTransaction().getOuts()
    
    const msg = Buffer.from(createHash("sha256").update(tx_buf).digest())

    let sig_buf: Buffer = undefined
    const sig: Signature = new Signature()
    if (key_type == 0){ //private_keys
        const key_data = generate_key_chain(network_data.xchain, private_key)
        const utxo_set: UTXOSet = (await network_data.xchain.getUTXOs(pub_addr)).utxos
        const my_utxos: UTXO[] = utxo_set.getAllUTXOs()
        run_security_checks(inputs, outputs, my_input, my_output, my_utxos)
        sig_buf = key_data.my_key_pair.sign(msg)
        sig.fromBuffer(sig_buf)
    }
    else if (key_type == 1){
        const my_wallet = MnemonicWallet.fromMnemonic(private_key)
        await my_wallet.resetHdIndices()
        await my_wallet.updateUtxosX()
        run_security_checks(inputs, outputs, my_input, my_output, my_wallet.utxosX.getAllUTXOs())

        const my_key = my_wallet.getKeyChainX().getKey(network_data.xchain.parseAddress(pub_addr))
        const sig_string = my_key.sign(msg)
        
        sig.fromBuffer(sig_string)
    }

    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.COLLECT_SIGS,
        "sig": sig.toBuffer(),
        "pub_addr": pub_addr,
    }

    const return_data = (await send_recieve(send_data, ip))
    if (return_data.length == 1){
        console.log("server did not issue in a timely manner, manually issuing tx")
        issuetx(return_data[0], network_ID)
    }
    else {
        console.log(`server succesfully issued tx of id ${return_data[1]}`)
    }

    const log_data = `successfully sent signature to CJ of id ${join_ID} using address ${pub_addr}.`
    
}

const check_inputs = function(inputs: TransferableInput[], my_input: TransferableInput, my_utxos: UTXO[]){
    let has_input: boolean = false
    let unwanted_utxo_count: number = 0
    for (let i = 0; i < inputs.length; i++){
        const check_item: TransferableInput = inputs[i]
        if (check_item.getTxID().equals(my_input.getTxID()) && check_item.getOutputIdx().equals(my_input.getOutputIdx())){
            has_input = true
        }
        else {
            for (let j = 0; j < my_utxos.length; j++){
                const test_utxo: UTXO = my_utxos[j]
                if (check_item.getTxID().equals(test_utxo.getTxID()) && check_item.getOutputIdx().equals(test_utxo.getOutputIdx())){
                    unwanted_utxo_count++
                    break
                }
            }
        }
    }
    if (!has_input){
        throw Error("Your input is not recorded in the transaction, server or coinjoin participants may be malicious")
    }
    if (unwanted_utxo_count > 0){
        throw Error(unwanted_utxo_count + " other utxo(s) that you own were recorded in the tx.  Server or cj participants may be malicious")
    }
}

const check_outputs = function(outputs: TransferableOutput[], my_output: TransferableOutput){
    let has_output: boolean = false
    for (let i = 0; i < outputs.length; i++){
        const check_item: TransferableOutput = outputs[i]
        if (check_item.toBuffer().equals(my_output.toBuffer())){
            has_output = true
        }
    }
    if (!has_output){
        throw Error("Your output is not recorded in the transaction, server or coinjoin participants may be malicious")
    }
}

const run_security_checks = function(inputs: TransferableInput[], outputs: TransferableOutput[], 
    my_input: TransferableInput, my_output: TransferableOutput, my_utxos: UTXO[]){
    check_inputs(inputs, my_input, my_utxos)
    check_outputs(outputs, my_output)
    console.log("All checks run, tx is good")
}

export { send_signature }