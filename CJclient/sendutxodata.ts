import {
    Avalanche,
    BinTools,
    Buffer,
    BN
  } from "avalanche" 
import { 
    AVMAPI,
    UTXOSet,
    UTXO,
    UnsignedTx,
    BaseTx,
    TransferableInput,
    TransferableOutput,
    SECPTransferInput,
    SECPTransferOutput,
    KeyChain,
    Tx
 } from "avalanche/dist/apis/avm";
 import { request } from "http"
 import {
    Defaults
}from "avalanche/dist/utils"
import { sendRecieve } from "./processmessage";
import { generatekeychain, generatexchain, getKeyType } from "./avalancheutils";
import { BNSCALE } from "./constants";
import { Network, NetworkConstants } from "@avalabs/avalanche-wallet-sdk";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";

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
    if (keyType == 0){  //for private keys
        const keyData = generatekeychain(networkData.xchain, privatekey)
        const myAddressBuf = keyData.myAddressBuf

        //establish inputs, outputs, and fees
        const inputs: TransferableInput[] = []
        const outputs: TransferableOutput[] = []

        //get utxos
        const utxoset: UTXOSet = (await xchain.getUTXOs(pubaddr)).utxos
        const utxos: UTXO[] = utxoset.getAllUTXOs()
        const balance: BN = utxoset.getBalance(myAddressBuf, assetid)

        let inputTotal: BN = new BN(0)

        



        console.log("checking funds in account")

        //cycle through utxos until enough currency has been collected
        if (balance.toNumber() >= targetInpAmountWithFee.toNumber()){
            for (let i = 0; i < utxos.length && inputTotal.toNumber() < targetInpAmountWithFee.toNumber(); i++){
                const current_utxo = utxos[i]
                const utxooutput: any = utxos[i].getOutput()
                if (utxooutput._typeID !== 11){
                    //get transaction, outputidx, and amount and put them in a transferableinput
                    const txid: Buffer = current_utxo.getTxID()
                    const outputidx: Buffer = current_utxo.getOutputIdx()
                    const utxoamt: BN = utxooutput.getAmount().clone()
                    inputTotal = inputTotal.add(utxoamt)
                    const secpTransferInput: SECPTransferInput = new SECPTransferInput(utxoamt)
                    secpTransferInput.addSignatureIdx(0, myAddressBuf[0])
                    const transferableinput: TransferableInput = new TransferableInput(txid, outputidx, assetidBuf, secpTransferInput)
                    inputs.push(transferableinput)
                }
            }
        } else {
            console.log("insufficient funds")
            throw Error //XXX fix this later
        }

        console.log("sufficient funds, creating input utxo")

        const changetotal: BN = inputTotal.sub(targetInpAmountWithFee)

        //construct outputs for the target and change utxos
        const targetOutput: SECPTransferOutput = new SECPTransferOutput(targetInpAmountFormatBN, myAddressBuf)
        const transferableTargetOutput: TransferableOutput = new TransferableOutput(assetidBuf, targetOutput)
        
        outputs.push(transferableTargetOutput)

        if (changetotal.toNumber() > 0){
            const changeOutput: SECPTransferOutput = new SECPTransferOutput(changetotal, myAddressBuf)
            const transferableChangeOutput: TransferableOutput = new TransferableOutput(assetidBuf, changeOutput)
            outputs.push(transferableChangeOutput)
        }

        const baseTx: BaseTx = new BaseTx (
            networkID,
            networkData.xchainidBuf,
            outputs,
            inputs,
            Buffer.from("test")
        )

        const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
        const signedTx: Tx = unsignedTx.sign(keyData.xKeyChain)
        id = await xchain.issueTx(signedTx)

        console.log("issued")

        let status: string = ""
        while (status != "Accepted" && status != "Rejected"){
            status = await xchain.getTxStatus(id)
        }
    
        if (status === "Rejected"){
            throw Error("rejected, not submitting to coinjoin")
        }
    }
    else if (keyType == 1){  //for mnemonics
        Network.setNetwork(NetworkConstants.TestnetConfig)
        const mwallet = MnemonicWallet.fromMnemonic(privatekey)
        await mwallet.resetHdIndices()
        await mwallet.updateUtxosX()
        
        if (mwallet.getBalanceX()[assetid].unlocked.toNumber() >= targetInpAmountWithFee.toNumber()){
            id = await mwallet.sendAvaxX(mwallet.getAddressX(), targetInpAmountFormatBN)
        }
        else{
            throw Error("insufficient funds in wallet")
        }
        await mwallet.resetHdIndices()
    }

    const inputTx = new Tx()
    inputTx.fromString(id)
    const outs = inputTx.getUnsignedTx().getTransaction().getOuts()

    let txindex = 0
    for (let i = 0; i < outs.length; i++){
        if (outs[i].getOutput().getAmount().toNumber() == targetInpAmountFormatted){
            break
        }
        txindex += 1
    }

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

    const returnData = {
        "joinid": joinid,
        "messagetype": 3,
        "pubaddr": pubaddr,
        "inputbuf": input.toBuffer(),
        "outputbuf": output.toBuffer(),
    }

    console.log("sending data to coinjoin server now")
    sendRecieve(returnData, networkID, joinid, pubaddr, privatekey, input, output)
}


export { sendutxodata }