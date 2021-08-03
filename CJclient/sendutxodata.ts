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
import { sendRecieve } from "./processmessage";
import { generate_key_chain, generate_xchain, get_key_type } from "./avalancheutils";
import { BNSCALE } from "./constants";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";
import * as consts from "./constants"
import { requestNonce } from "./requestnonce";
import { log_info } from "./loginfo";

//setting up the xchain object
const bintools: BinTools = BinTools.getInstance()

const sendutxodata = async(join_id: number, assetid: string, inputamount: number, 
    outputamount: number, destinationaddr: string, privatekey: string, networkID: number): Promise<any> => {
    const network_data = generate_xchain(networkID)
    const xchain = network_data.xchain
    const assetid_buf: Buffer = bintools.cb58Decode(assetid)

    //get the input and output amounts
    const fee: BN = xchain.getDefaultTxFee()
    const inp_amount: BN = new BN(inputamount*BNSCALE)
    const inp_amount_fee: BN = inp_amount.add(fee)

    const out_amount: BN = new BN(outputamount*BNSCALE)

    const key_type = get_key_type(privatekey)
    
    let pubaddr = ""
    let id = ""
    let signed_tx: Tx = new Tx()
    let my_addresses: string[] = []
    let my_address_buf: Buffer[] = []
    if (key_type == 0){  //for private keys
        const key_data = generate_key_chain(network_data.xchain, privatekey)
        my_addresses = key_data.myAddressStrings
        my_address_buf = key_data.myAddressBuf
        pubaddr = xchain.addressFromBuffer(my_address_buf[0])

        //get utxos
        const utxoset: UTXOSet = (await xchain.getUTXOs(pubaddr)).utxos
        const balance: BN = utxoset.getBalance(my_address_buf, assetid)

        if (balance.gte(inp_amount_fee)) {
            const unsignedTx = await xchain.buildBaseTx(utxoset, inp_amount, assetid, my_addresses, my_addresses, my_addresses)
            signed_tx = unsignedTx.sign(key_data.xKeyChain)

        } else {
            console.log("insufficient funds")
            throw Error //XXX fix this later
        }
    }

    else if (key_type == 1){  //for mnemonics
        const mwallet = MnemonicWallet.fromMnemonic(privatekey)
        await mwallet.resetHdIndices()
        await mwallet.updateUtxosX()
        const from = mwallet.getAllAddressesX()
        const to = mwallet.getAddressX()
        const change = mwallet.getChangeAddressX()
        const walletutxos: any = mwallet.utxosX
        
        if (mwallet.getBalanceX()[assetid].unlocked.gte(inp_amount_fee)){
            const unsignedTx = await xchain.buildBaseTx(walletutxos, inp_amount, assetid, [to], from, [change])
            signed_tx = await mwallet.signX(unsignedTx)
        }
        else{
            throw Error("insufficient funds in wallet")
        }
    }
    id = await xchain.issueTx(signed_tx)
    console.log("issued")

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await xchain.getTxStatus(id)
    }

    if (status === "Rejected"){
        throw Error("rejected, not submitting to coinjoin")
    }

    console.log("Accepted")

    const outs = signed_tx.getUnsignedTx().getTransaction().getOuts()

    let txindex = 0
    for (let i = 0; i < outs.length; i++){
        if (outs[i].getOutput().getAmount().eq(inp_amount)){
            break
        }
        txindex += 1
    }

    my_address_buf = [signed_tx.getUnsignedTx().getTransaction().getOuts()[txindex].getOutput().getAddress(0)]
    pubaddr = xchain.addressFromBuffer(my_address_buf[0])
    
    console.log("constructing my input")
    
    //construct input
    const txid: Buffer = bintools.cb58Decode(id)
    const outputidx = Buffer.alloc(4)
    outputidx.writeIntBE(txindex, 0, 4)

    const secpTransferInput:  SECPTransferInput = new SECPTransferInput(inp_amount)
    secpTransferInput.addSignatureIdx(0, my_address_buf[0])
    const input:  TransferableInput = new TransferableInput(txid, outputidx, assetid_buf, secpTransferInput)

    console.log("constructing my output")

    const outputaddressBuf: Buffer[] = [xchain.parseAddress(destinationaddr)]
    const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(out_amount, outputaddressBuf)
    const output: TransferableOutput = new TransferableOutput(assetid_buf, secpTransferOutput)

    const ticket = await requestNonce(join_id, pubaddr, privatekey, networkID)

    const sendData = {
        "joinid": join_id,
        "messagetype": consts.COLLECT_INPUTS,
        "pubaddr": pubaddr,
        "ticket": ticket,
        "inputbuf": input.toBuffer(),
        "outputbuf": output.toBuffer(),
    }

    console.log("sending data to coinjoin server now")
    const log_data = `successfully joined CJ of id ${join_id} using address ${pubaddr}.`
    console.log(log_data)
    log_info(log_data)
    const recievedData = (await sendRecieve(sendData))[0]

    return [recievedData, input, output, pubaddr]
}


export { sendutxodata }