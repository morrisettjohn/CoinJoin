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

/*const data = {
    "joinid": 6,
    "assetid": "23wKfz3viWLmjWo2UZ7xWegjvnZFenGAVkouwQCeB9ubPXodG6",
    "assetamount": 10,
    "destinationaddr": "feec1",
    "pubaddr": "X-avax1slt2dhfu6a6qezcn5sgtagumq8ag8we75f84sw"
}*/

//setting up the 
const BNSCALE: number = 1000000000

const bintools: BinTools = BinTools.getInstance()
const Ip: string = "api.avax.network"
const networkID: number = 1
const port: number = 443
const protocol: string = "https"
const xchainid = "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM"
const xchainidBuf: Buffer = bintools.cb58Decode(xchainid)

const avax: Avalanche = new Avalanche(Ip, port, protocol, networkID, xchainid);
avax.setRequestConfig('withCredentials', true)

const xchain: AVMAPI = avax.XChain(); //returns a reference to the X-Chain used by AvalancheJS
const xKeychain: KeyChain = xchain.keyChain()
const privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
xKeychain.importKey(privKey)
const fee: BN = xchain.getDefaultTxFee()

const inputs: TransferableInput[] = []
const outputs: TransferableOutput[] = []

const getRequestedUtxo = async(joinid: number, assetid: string, assetamount: 
    number, destinationaddr: string, pubaddr: string): Promise<any> => {
    const TARGET_AMOUNT: number = assetamount
    const targetAmountFormatted: number = TARGET_AMOUNT*BNSCALE
    const targetAmountFormatBN: BN = new BN(targetAmountFormatted)
    const address: string = pubaddr
    const addressbuffer: Buffer[] = [xchain.parseAddress(address)]

    const utxoset: UTXOSet = (await xchain.getUTXOs(address)).utxos
    const utxos: UTXO[] = utxoset.getAllUTXOs()
    const balance: BN = utxoset.getBalance(addressbuffer, assetid)
    const amt: BN = new BN(0)
    const usedUTXOSet: UTXOSet = new UTXOSet()
    
    //cycle through utxos until sufficent data has been achieved
    if (balance >= targetAmountFormatBN.add(fee)){
        for (let i = 0; i < utxos.length && amt < targetAmountFormatBN; i++){
            const utxooutput: any = utxos[i].getOutput()
            const quantityBN: BN = utxooutput.getAmount()
            amt.add(quantityBN)
            usedUTXOSet.add(utxos[i])
        }
    } else {
        console.log("insufficient funds")
        throw Error //XXX fix this later
    }

    const inputTotal = usedUTXOSet.getBalance(addressbuffer, assetid)
    const usedUTXOs: UTXO[] = usedUTXOSet.getAllUTXOs()

    //construct inputs for the target
    usedUTXOs.forEach((utxo: UTXO) =>{
        console.log(utxo.toString())
        const txid: Buffer = utxo.getTxID()
        const outputidx: Buffer = utxo.getOutputIdx()
        const amountOutput: any = utxo.getOutput()
        
        if (amountOutput._typeID !== 11){
            const utxoamt: BN = amountOutput.getAmount().clone()

            const secpTransferInput:  SECPTransferInput = new SECPTransferInput(utxoamt)
            const transferableinput: TransferableInput = new TransferableInput(txid, outputidx, xchainidBuf, secpTransferInput)
            inputs.push(transferableinput)
        }
    })

    const changetotal: BN = inputTotal.sub(targetAmountFormatBN).sub(fee)

    //construct outputs for the target and change utxos
    const targetOutput: SECPTransferOutput = new SECPTransferOutput(targetAmountFormatBN, addressbuffer)
    const transferableTargetOutput: TransferableOutput = new TransferableOutput(xchainidBuf, targetOutput)

    const changeOutput: SECPTransferOutput = new SECPTransferOutput(changetotal, addressbuffer)
    const transferableChangeOutput: TransferableOutput = new TransferableOutput(xchainidBuf, changeOutput)
    
    outputs.push(transferableTargetOutput, transferableChangeOutput)
    const txindex = outputs.indexOf(transferableTargetOutput)

    const baseTx: BaseTx = new BaseTx (
        networkID,
        bintools.cb58Decode(xchainid),
        outputs,
        inputs,
    )
    
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    const signedTx: Tx = unsignedTx.sign(xKeychain)
    
    const id: string = await xchain.issueTx(signedTx)

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await xchain.getTxStatus(id)
    }

    if (status === "Rejected"){
        throw Error("rejected, not submitting to coinjoin")
    }

    const returndata = {
        joinid,
        "messagetype": 3,
        "transactionid": id,
        "transactionoffset": txindex,
        assetid,
        assetamount,
        destinationaddr,
        pubaddr,
    }

    const returndatastring = JSON.stringify(returndata)
    const req = request(  //### change this to whatever the data of the server is in general
        {
            host: "100.64.15.72",
            port: "65432",
            method: "POST",
            headers: {
                "Content-Length": Buffer.byteLength(returndatastring)
            }
            
        }
    )
    req.write(returndatastring)
    req.end()
}
getRequestedUtxo(6, "23wKfz3viWLmjWo2UZ7xWegjvnZFenGAVkouwQCeB9ubPXodG6", 10, "feec1", "X-avax1slt2dhfu6a6qezcn5sgtagumq8ag8we75f84sw")

export { getRequestedUtxo }