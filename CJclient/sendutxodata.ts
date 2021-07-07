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

//setting up the xchain object
const BNSCALE: number = 1000000000
const bintools: BinTools = BinTools.getInstance()
const Ip: string = "api.avax-test.network"
const networkID: number = 5
const port: number = 443
const protocol: string = "https"
const xchainid: string = Defaults.network[networkID].X.blockchainID
const xchainidBuf: Buffer = bintools.cb58Decode(xchainid)
const avax: Avalanche = new Avalanche(Ip, port, protocol, networkID);
avax.setRequestConfig('withCredentials', true)
const xchain: AVMAPI = avax.XChain(); //returns a reference to the X-Chain used by AvalancheJS


const sendutxodata = async(joinid: number, assetid: string, inputamount: number, 
    outputamount: number, destinationaddr: string, pubaddr: string, privatekey: string): Promise<any> => {

    //establish inputs, outputs, and fees
    const inputs: TransferableInput[] = []
    const outputs: TransferableOutput[] = []
    const fee: BN = xchain.getDefaultTxFee()

    //retrieve addresses
    const xKeychain: KeyChain = xchain.keyChain()
    xKeychain.importKey(privatekey)
    const myAddressBuf = xchain.keyChain().getAddresses()
    const myAddressStrings = xchain.keyChain().getAddressStrings()
    
    //get the input and output amounts
    const targetInpAmountFormatted: number = inputamount*BNSCALE
    const targetInpAmountFormatBN: BN = new BN(targetInpAmountFormatted)
    const targetInpAmountWithFee: BN = targetInpAmountFormatBN.add(fee)

    const targetOutAmountFormatted: number = outputamount*BNSCALE
    const targetOutAmountFormatBN: BN = new BN(targetOutAmountFormatted)

    //get utxos
    const utxoset: UTXOSet = (await xchain.getUTXOs(pubaddr)).utxos
    const utxos: UTXO[] = utxoset.getAllUTXOs()
    const balance: BN = utxoset.getBalance(myAddressBuf, assetid)

    let inputTotal: BN = new BN(0)
    const assetidBuf: Buffer = bintools.cb58Decode(assetid)

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
        xchainidBuf,
        outputs,
        inputs,
        Buffer.from("test")
    )

    const outs = baseTx.getOuts()
    let txindex = 0
    
    for (let i = 0; i < outs.length; i++){
        if (outs[i].getOutput().getAmount().toNumber() == targetInpAmountFormatted){
            break
        }
        txindex += 1
    }
    
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    const signedTx: Tx = unsignedTx.sign(xKeychain)
    const id: string = await xchain.issueTx(signedTx)

    console.log("issued")

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await xchain.getTxStatus(id)
    }

    if (status === "Rejected"){
        throw Error("rejected, not submitting to coinjoin")
    }


    console.log("constructing my input")

    //construct input
    const txidstring: string = id
    const txid: Buffer = bintools.cb58Decode(txidstring)
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
        "input": input, //XXX this is just for testing
        "output": output //XXX also for testing
    }

    console.log("sending data to coinjoin server now")
    sendRecieve(returnData, joinid, pubaddr, privatekey, input, output)
}


export { sendutxodata }