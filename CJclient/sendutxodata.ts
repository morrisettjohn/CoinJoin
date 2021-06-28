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
    AmountOutput,
    AmountInput,
    SECPTransferInput,
    SECPTransferOutput,
    KeyChain,
    Tx
 } from "avalanche/dist/apis/avm";
 import { request } from "http"
 import {
    Defaults
}from "avalanche/dist/utils"
import { sendsignature } from "./sendsignature";

/*const data = {
    "joinid": 6,
    "assetid": "23wKfz3viWLmjWo2UZ7xWegjvnZFenGAVkouwQCeB9ubPXodG6",
    "assetamount": 10,
    "destinationaddr": "feec1",
    "pubaddr": "X-avax1slt2dhfu6a6qezcn5sgtagumq8ag8we75f84sw"
}*/

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


const sendutxodata = async(joinid: number, assetid: string, assetamount: 
    number, destinationaddr: string, pubaddr: string, privatekey: string): Promise<any> => {

    //establish inputs, outputs, and fees
    const inputs: TransferableInput[] = []
    const outputs: TransferableOutput[] = []
    const fee: BN = xchain.getDefaultTxFee()

    //retrieve addresses
    const xKeychain: KeyChain = xchain.keyChain()
    xKeychain.importKey(privatekey)
    const myAddressBuf = xchain.keyChain().getAddresses()
    const myAddressStrings = xchain.keyChain().getAddressStrings()
    
 
    //get the target amount
    const targetAmountFormatted: number = assetamount*BNSCALE
    const targetAmountFormatBN: BN = new BN(targetAmountFormatted)
    const targetAmountWithFee: BN = targetAmountFormatBN.add(fee)

    //get utxos
    const utxoset: UTXOSet = (await xchain.getUTXOs(pubaddr)).utxos
    const utxos: UTXO[] = utxoset.getAllUTXOs()
    const balance: BN = utxoset.getBalance(myAddressBuf, assetid)

    let inputTotal: BN = new BN(0)
    const assetidBuf: Buffer = bintools.cb58Decode(assetid)

    //cycle through utxos until enough currency has been collected
    if (balance.toNumber() >= targetAmountWithFee.toNumber()){
        for (let i = 0; i < utxos.length && inputTotal.toNumber() < targetAmountWithFee.toNumber(); i++){
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

    const changetotal: BN = inputTotal.sub(targetAmountWithFee)

    //construct outputs for the target and change utxos
    const targetOutput: SECPTransferOutput = new SECPTransferOutput(targetAmountFormatBN, myAddressBuf)
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
        if (outs[i].getOutput().getAmount().toNumber() == targetAmountFormatted){
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
    console.log("accepted, sending data to coinjoin server now")

    if (status === "Rejected"){
        throw Error("rejected, not submitting to coinjoin")
    }

    //construct input
    const txidstring: string = id
    const txid: Buffer = bintools.cb58Decode(txidstring)
    const outputidx = Buffer.alloc(4)
    outputidx.writeIntBE(txindex, 0, 4)

    const secpTransferInput:  SECPTransferInput = new SECPTransferInput(targetAmountFormatBN)
    secpTransferInput.addSignatureIdx(0, myAddressBuf[0])
    const input:  TransferableInput = new TransferableInput(txid, outputidx, assetidBuf, secpTransferInput)
    

    const returndata = {
        "joinid": joinid,
        "messagetype": 3,
        "transactionid": id,
        "transactionoffset": txindex,
        "assetid": assetid,
        "assetamount": assetamount,
        "destinationaddr": destinationaddr,
        "pubaddr": pubaddr,
        "inputbuf": input.toBuffer()
    }

    const returndatastring = JSON.stringify(returndata)
    const options = {
        host: "100.64.15.72",
        port: "65432",
        method: "POST",
        headers: {
            "Content-Length": Buffer.byteLength(returndatastring)
        }
    }

    let recievedData: Buffer = new Buffer("")

    const req = request(options, res => {
        res.on("data", d => {
            recievedData = new Buffer(d)
            console.log(recievedData.toString())
        })
        res.on("end", ()=> {
            sendsignature(joinid, JSON.parse(recievedData.toString()), pubaddr, privatekey)
        })
    })
    req.write(returndatastring)
    req.end()
}


export { sendutxodata }