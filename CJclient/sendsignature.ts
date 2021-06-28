import {
    Avalanche,
    BinTools,
    Buffer,
    BN
  } from "avalanche" 
import { 
    AVMAPI,
    UTXOSet,
    TransferableInput,
    TransferableOutput,
    KeyChain,
    SECPTransferInput,
    SECPTransferOutput,
    BaseTx,
    UnsignedTx,
    Tx
 } from "avalanche/dist/apis/avm"
import { PlatformVMAPI, SECPCredential } from "avalanche/dist/apis/platformvm"
import { Credential, Signature, StandardBaseTx } from "avalanche/dist/common"
import { request } from "http"
import { Defaults }from "avalanche/dist/utils"
import { issuetx } from "./issuetx"

import Sha256 from "sha.js/sha256"
import { createHash } from "crypto"
import { SigIdx } from "avalanche/dist/common/credentials"

const BNSCALE: number = 1000000000
const bintools: BinTools = BinTools.getInstance()
const Ip: string = "api.avax-test.network"
const networkID: number = 5
const port: number = 443
const protocol: string = "https"
const xchainid: string = Defaults.network[networkID].X.blockchainID
const xchainidBuf: Buffer = bintools.cb58Decode(xchainid)
const avax: Avalanche = new Avalanche(Ip, port, protocol, networkID, xchainid);
avax.setRequestConfig('withCredentials', true)

const xchain: AVMAPI = avax.XChain();
const fee:  BN = xchain.getDefaultTxFee()

const sendsignature = async(joinid: number, data: any, pubaddr: string, privatekey: string): Promise<any> => {
    const inputs: TransferableInput[] = []
    const outputs: TransferableOutput[] = []
    const inputData = data["inputs"]
    const outputData = data["outputs"]

    const xKeyChain: KeyChain = xchain.keyChain();
    const myKeyPair = xKeyChain.importKey(privatekey)
    const myAddressBuf = xchain.keyChain().getAddresses()
    const myAddressStrings = xchain.keyChain().getAddressStrings()

    //construct inputs
    console.log("constructing tx")
    for (let i = 0; i < inputData.length; i++){
        const inputObject = inputData[i]

        console.log(inputData)

        const amt: BN = new BN(inputObject["amount"]*BNSCALE)
        const txidstring: string = inputObject["transactionid"]
        const txid: Buffer = bintools.cb58Decode(txidstring)
        const outputidx = Buffer.alloc(4)
        outputidx.writeIntBE(inputObject["transactionoffset"], 0, 4)
        const assetid = inputObject["assetid"]
        const assetidBuf: Buffer = bintools.cb58Decode(assetid)

        const secpTransferInput:  SECPTransferInput = new SECPTransferInput(amt)
        secpTransferInput.addSignatureIdx(0, Buffer.from(inputObject["pubaddr"]))
        console.log(secpTransferInput.getSigIdxs()[0])
        const input:  TransferableInput = new TransferableInput(txid, outputidx, assetidBuf, secpTransferInput)

        console.log("here")

        inputs.push(input)

    }
    //construct outputs
    for (let i = 0; i < outputData.length; i++){
        const outputObject = outputData[i]
        const amt: BN = new BN(outputObject["amount"]*BNSCALE)
        const outputaddress = outputObject["destinationaddr"]
        const outputaddressBuf: Buffer[] = [xchain.parseAddress(outputaddress)]
        const assetid = outputObject["assetid"]
        const assetidBuf: Buffer = bintools.cb58Decode(assetid)

        const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(amt, outputaddressBuf)
        const transferableOutput: TransferableOutput = new TransferableOutput(assetidBuf, secpTransferOutput)
        outputs.push(transferableOutput)
    }

    const baseTx: BaseTx = new BaseTx (
        networkID,
        bintools.cb58Decode(xchainid),
        outputs,
        inputs,
        Buffer.from("test")
    )
    
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)

    console.log("creating signature")
    const txbuff = unsignedTx.toBuffer().toString()
    const msg = Buffer.from(createHash("sha256").update(txbuff).digest())
    const sigbuf = myKeyPair.sign(msg)
    const sig: Signature = new Signature()
    sig.fromBuffer(sigbuf)
    
    const returndata = {
        "joinid": joinid,
        "messagetype": 4,
        "signature": sig.toBuffer(),
        "pubaddr": pubaddr,
        "transaction": txbuff,
        "inputorder": "2"
    }

    const returndatastring = JSON.stringify(returndata)

    const options = {
        host: "192.168.129.105",
        port: "65432",
        method: "POST",
        headers: {
            "Content-Length": Buffer.byteLength(returndatastring)
        }
    }

    console.log("sending data")
    let recievedData: Buffer = new Buffer("")
    const req = request(options, res => {
        res.on("data", d => {
            recievedData = new Buffer(d)
        })
        res.on("end", ()=> {
            issuetx(JSON.parse(recievedData.toString()))
            
        })
    })
    req.write(returndatastring)
    req.end()
    
}

export { sendsignature }