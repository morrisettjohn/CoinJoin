import {
    BinTools,
    Buffer,
    BN
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { 
    UTXOSet,
    TransferableInput,
    TransferableOutput,
    SECPTransferInput,
    SECPTransferOutput,
    Tx
 } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm";
import { send_recieve } from "./processmessage";
import { generate_key_chain, generate_xchain, get_key_type } from "./avalancheutils";
import { BNSCALE } from "./constants";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";
import * as consts from "./constants"
import { request_nonce } from "./requestnonce";
import { add_log } from "./addlog";
import { KeyChain, KeyPair } from "avalanche/dist/apis/avm";

//setting up the xchain object
const bintools: BinTools = BinTools.getInstance()

const send_input_data = async(join_ID: number, asset_ID: string, input_amount: number, output_amount: number, 
    dest_addr: string, private_key: string, network_ID: number, join_tx_ID: string, server_addr: string, ip: string,): Promise<any> => {

        const network_data = generate_xchain(network_ID)
        const xchain = network_data.xchain

        const sent_data = await send_target_amount(network_ID, private_key, input_amount, asset_ID)

        const tx_ID = sent_data["tx_ID"]
        const tx_index = sent_data["tx_index"]
        const pub_addr_buf = sent_data["pub_addr_buf"]
        const pub_addr = xchain.addressFromBuffer(pub_addr_buf)

        const input: TransferableInput = craft_input(input_amount, asset_ID, tx_ID, tx_index, pub_addr, network_ID)
        const output: TransferableOutput = craft_output(output_amount, asset_ID, dest_addr, network_ID)

        const nonce_sig_pair = await request_nonce(join_ID, pub_addr, private_key, network_ID, ip)
        const nonce = nonce_sig_pair[0]
        const nonce_sig = nonce_sig_pair[1]

        construct_log(join_tx_ID, join_ID, ip, network_ID, pub_addr, server_addr, input, output)
        const recieved_data = await send_data(join_ID, pub_addr, nonce, nonce_sig, input, output, ip)


        return [recieved_data, input, output, pub_addr]
    }

const construct_log = async(join_tx_ID: string, join_ID: number, ip: string, network_ID: number,
    user_addr: string, server_addr: string, input: any, output: any) => {
    const join_tx_data = {
        "server_addr": server_addr,
        "join_tx_ID": join_tx_ID,
        "join_ID": join_ID,
        "host": ip,
        "network_ID": network_ID,
        "users": {}
    }

    const user_data = {
        "pub_addr": user_addr,
        "input": input.toBuffer(), 
        "output": output.toBuffer(), 
        "last_status": consts.COLLECT_INPUTS,
        "time": new Date().getTime()
    }
    add_log(server_addr, join_tx_ID, join_tx_data, user_addr, user_data)
}

const craft_input = function(input_amount: number, asset_ID: string, tx_ID: string, 
    tx_index: number, pubaddr: string, network_ID: number): TransferableInput {

    const network_data = generate_xchain(network_ID)
    const xchain = network_data.xchain

    const asset_ID_buf: Buffer = bintools.cb58Decode(asset_ID)
    const pub_addr_buf = xchain.parseAddress(pubaddr)
    const inp_amount: BN = new BN(input_amount*BNSCALE)
    const tx_ID_buf: Buffer = bintools.cb58Decode(tx_ID)
    const output_idx = Buffer.alloc(4)
    output_idx.writeIntBE(tx_index, 0, 4)

    const secp_transfer_input:  SECPTransferInput = new SECPTransferInput(inp_amount)
    secp_transfer_input.addSignatureIdx(0, pub_addr_buf)
    const input:  TransferableInput = new TransferableInput(tx_ID_buf, output_idx, asset_ID_buf, secp_transfer_input)

    return input
}

const craft_output = function(output_amount: number, asset_ID: string, 
    dest_addr: string, network_ID: number): TransferableOutput {

    const network_data = generate_xchain(network_ID)
    const xchain = network_data.xchain

    const asset_ID_buf: Buffer = bintools.cb58Decode(asset_ID)
    const out_amount: BN = new BN(output_amount*BNSCALE)
    const output_addr_buf: Buffer[] = [xchain.parseAddress(dest_addr)]

    const secp_tranfser_output: SECPTransferOutput = new SECPTransferOutput(out_amount, output_addr_buf)
    const output: TransferableOutput = new TransferableOutput(asset_ID_buf, secp_tranfser_output)

    return output
}

const send_target_amount = async(network_ID: number, private_key: string, input_amount: number, asset_ID: string): Promise<Object> => {
    const network_data = generate_xchain(network_ID)
    const xchain = network_data.xchain

    //get the input and output amounts
    const fee: BN = xchain.getDefaultTxFee()
    const inp_amount: BN = new BN(input_amount*BNSCALE)
    const inp_amount_fee: BN = inp_amount.add(fee)

    const key_type = get_key_type(private_key)
    
    let signed_tx: Tx = new Tx()
    if (key_type == 0){  //for private keys
        const key_data = generate_key_chain(network_data.xchain, private_key)
        const key_chain_addrs = key_data.my_addr_strings
        const pub_addr_buf = key_data.my_addr_buf
        const pub_addr = xchain.addressFromBuffer(pub_addr_buf[0])

        //get utxos
        const utxo_set: UTXOSet = (await xchain.getUTXOs(pub_addr)).utxos
        const balance: BN = utxo_set.getBalance(pub_addr_buf, asset_ID)

        if (balance.gte(inp_amount_fee)) {
            const unsigned_tx = await xchain.buildBaseTx(utxo_set, inp_amount, asset_ID, key_chain_addrs, key_chain_addrs, key_chain_addrs)
            signed_tx = unsigned_tx.sign(key_data.x_key_chain)

        } else {
            console.log("insufficient funds")
            throw Error //XXX fix this later
        }
    }

    else if (key_type == 1){  //for mnemonics
        const my_wallet = MnemonicWallet.fromMnemonic(private_key)
        await my_wallet.resetHdIndices()
        await my_wallet.updateUtxosX()
        
        const from = my_wallet.getAllAddressesX()
        const to = my_wallet.getAddressX()
        const change = my_wallet.getChangeAddressX()
        const wallet_utxos: any = my_wallet.utxosX
        
        if (my_wallet.getBalanceX()[asset_ID].unlocked.gte(inp_amount_fee)){
            const unsigned_tx = await xchain.buildBaseTx(wallet_utxos, inp_amount, asset_ID, [to], from, [change])
            signed_tx = await my_wallet.signX(unsigned_tx)
        }
        else{
            throw Error("insufficient funds in wallet")
        }
    }

    const tx_ID = await xchain.issueTx(signed_tx)
    console.log("issued")

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await xchain.getTxStatus(tx_ID)
    }

    if (status === "Rejected"){
        throw Error("rejected, not submitting to coinjoin")
    }

    console.log("Accepted")

    const outs = signed_tx.getUnsignedTx().getTransaction().getOuts()

    let tx_index = 0
    for (let i = 0; i < outs.length; i++){
        if (outs[i].getOutput().getAmount().eq(inp_amount)){
            break
        }
        tx_index += 1
    }
    const pub_addr_buf = signed_tx.getUnsignedTx().getTransaction().getOuts()[tx_index].getOutput().getAddress(0)

    return {"tx_ID": tx_ID, "tx_index": tx_index, "pub_addr_buf": pub_addr_buf}
}

const send_data = async(join_ID: number, pub_addr: string, nonce: string, nonce_sig: Buffer ,
    input: TransferableInput, output: TransferableOutput, ip: string): Promise<any> => {

    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.COLLECT_INPUTS,
        "pub_addr": pub_addr,
        "nonce": nonce,
        "nonce_sig": nonce_sig,
        "input_buf": input.toBuffer(),
        "output_buf": output.toBuffer()
    }
    
    console.log("sending data to coinjoin server now")

    const recieved_data = (await send_recieve(send_data, ip))[0]
    return recieved_data
}

export { send_input_data }