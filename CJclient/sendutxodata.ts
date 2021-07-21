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
import { generatekeychain, generatexchain, getKeyType } from "./avalancheutils";
import { BNSCALE } from "./constants";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";
import * as consts from "./constants"
import { requestNonce } from "./requestjoin";

//setting up the xchain object
const bintools: BinTools = BinTools.getInstance()

const sendutxodata = async(joinid: number, assetid: string, inputamount: number, 
    outputamount: number, destinationaddr: string, pubaddr: string, privatekey: string, networkID: number): Promise<any> => {
    const networkData = generatexchain(networkID)
    const xchain = networkData.xchain
    const assetidBuf: Buffer = bintools.cb58Decode(assetid)

    //get the input and output amounts
    const fee: BN = xchain.getDefaultTxFee()
    const targetInpAmountFormatted: number = inputamount*BNSCALE
    const targetInpAmountFormatBN: BN = new BN(targetInpAmountFormatted)
    const targetInpAmountWithFee: BN = targetInpAmountFormatBN.add(fee)

    const targetOutAmountFormatted: number = outputamount*BNSCALE
    const targetOutAmountFormatBN: BN = new BN(targetOutAmountFormatted)

    const keyType = getKeyType(privatekey)
    

    let id = ""
    let signedTx: Tx = new Tx()
    let myAddresses: string[] = []
    let myAddressBuf: Buffer[] = []
    if (keyType == 0){  //for private keys
        const keyData = generatekeychain(networkData.xchain, privatekey)
        myAddresses = keyData.myAddressStrings
        myAddressBuf = keyData.myAddressBuf

        //get utxos
        const utxoset: UTXOSet = (await xchain.getUTXOs(pubaddr)).utxos
        const balance: BN = utxoset.getBalance(myAddressBuf, assetid)

        if (balance.toNumber() >= targetInpAmountWithFee.toNumber()) {
            const unsignedTx = await xchain.buildBaseTx(utxoset, targetInpAmountFormatBN, assetid, myAddresses, myAddresses, myAddresses)
            signedTx = unsignedTx.sign(keyData.xKeyChain)

        } else {
            console.log("insufficient funds")
            throw Error //XXX fix this later
        }
    }

    else if (keyType == 1){  //for mnemonics
        const mwallet = MnemonicWallet.fromMnemonic(privatekey)
        await mwallet.resetHdIndices()
        await mwallet.updateUtxosX()
        const from = mwallet.getAllAddressesX()
        const to = mwallet.getAddressX()
        const change = mwallet.getChangeAddressX()
        const walletutxos: any = mwallet.utxosX
        
        if (mwallet.getBalanceX()[assetid].unlocked.toNumber() >= targetInpAmountWithFee.toNumber()){
            const unsignedTx = await xchain.buildBaseTx(walletutxos, targetInpAmountFormatBN, assetid, [to], from, [change])
            signedTx = await mwallet.signX(unsignedTx)
            id = await xchain.issueTx(signedTx)
        }
        else{
            throw Error("insufficient funds in wallet")
        }
    }
    id = await xchain.issueTx(signedTx)
    console.log("issued")

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await xchain.getTxStatus(id)
    }

    if (status === "Rejected"){
        throw Error("rejected, not submitting to coinjoin")
    }

    console.log("Accepted")

    const outs = signedTx.getUnsignedTx().getTransaction().getOuts()

    let txindex = 0
    for (let i = 0; i < outs.length; i++){
        if (outs[i].getOutput().getAmount().toNumber() == targetInpAmountFormatted){
            break
        }
        txindex += 1
    }

    myAddressBuf = [signedTx.getUnsignedTx().getTransaction().getOuts()[txindex].getOutput().getAddress(0)]
    pubaddr = xchain.addressFromBuffer(myAddressBuf[0])
    
    console.log("constructing my input")
    
    //construct input
    const txid: Buffer = bintools.cb58Decode(id)
    const outputidx = Buffer.alloc(4)
    outputidx.writeIntBE(txindex, 0, 4)

    const secpTransferInput:  SECPTransferInput = new SECPTransferInput(targetInpAmountFormatBN)
    secpTransferInput.addSignatureIdx(0, myAddressBuf[0])
    const input:  TransferableInput = new TransferableInput(txid, outputidx, assetidBuf, secpTransferInput)

    console.log("constructing my output")

    const outputaddressBuf: Buffer[] = [xchain.parseAddress(destinationaddr)]
    const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(targetOutAmountFormatBN, outputaddressBuf)
    const output: TransferableOutput = new TransferableOutput(assetidBuf, secpTransferOutput)

    const ticket = await requestNonce(joinid, pubaddr, privatekey, networkID)

    const sendData = {
        "joinid": joinid,
        "messagetype": consts.COLLECT_INPUTS,
        "pubaddr": pubaddr,
        "ticket": ticket,
        "inputbuf": input.toBuffer(),
        "outputbuf": output.toBuffer(),
    }

    console.log("sending data to coinjoin server now")
    const recievedData = await sendRecieve(sendData)
    return [recievedData, input, output, pubaddr]
}


export { sendutxodata }