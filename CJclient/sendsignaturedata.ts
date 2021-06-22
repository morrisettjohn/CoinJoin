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
 } from "avalanche/dist/apis/avm"
import { PlatformVMAPI } from "avalanche/dist/apis/platformvm"
import { Credential, Signature } from "avalanche/dist/common"
import { request } from "http"
 import {
     Defaults
 }from "avalanche/dist/utils"
import { Address } from "avalanche/src/common"

const BNSCALE: number = 1000000000

const bintools: BinTools = BinTools.getInstance()
const Ip: string = "api.avax.network"
const networkID: number = 1
const port: number = 443
const protocol: string = "https"
const xchainid = "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM"
const xchainidBuf: Buffer = bintools.cb58Decode(xchainid)
const blockchainID: string = Defaults.network[networkID].X.blockchainID
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const avaxAssetIDBuf: Buffer = bintools.cb58Decode(avaxAssetID)

const avax: Avalanche = new Avalanche(Ip, port, protocol, networkID, xchainid);
avax.setRequestConfig('withCredentials', true)

const xchain: AVMAPI = avax.XChain();
const pchain: PlatformVMAPI = avax.PChain();


const xKeyChain: KeyChain = xchain.keyChain();

const fee:  BN = xchain.getDefaultTxFee()

const inputs: TransferableInput[] = []
const outputs: TransferableOutput[] = []

const sendsignature = async(joinid: number, data: any, pubaddr: string, privKey: string): Promise<any> => {
    const inputData = data["inputs"]
    const outputData = data["outputs"]

    const myKeyPair = xKeyChain.importKey(privKey)

    //construct inputs
    for (let i = 0; i < inputData.length; i++){
        const inputObject = inputData[i]
        const amt: BN = new BN(inputObject["amount"]*BNSCALE)
        const txidstring: string = inputObject["transactionid"]
        const txid: Buffer = Buffer.from(txidstring)
        const outputidxBuffer: BN = new BN(inputObject["transactionoffset"])
        const outputidx = outputidxBuffer.toBuffer()
        const secpTransferInput:  SECPTransferInput = new SECPTransferInput(amt)
        //secpTransferInput.addSignatureIdx(0, Buffer.from(inputObject["pubaddr"]))
        const input:  TransferableInput = new TransferableInput(txid, outputidx, xchainidBuf, secpTransferInput)
        inputs.push(input)
    }
    for (let i = 0; i < outputData.length; i++){
        const outputObject = outputData[i]
        const amt: BN = new BN(outputObject["amount"] * BNSCALE)
        const address = outputObject["destinationaddr"]
        const addressBuf: Buffer[] = [Buffer.from(address)]
        const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(amt, addressBuf)
        const transferableOutput: TransferableOutput = new TransferableOutput(xchainidBuf, secpTransferOutput)
        outputs.push(transferableOutput)
    }
    const baseTx: BaseTx = new BaseTx (
        networkID,
        bintools.cb58Decode(blockchainID),
        outputs,
        inputs
    )

    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
    const sigbuf = myKeyPair.sign(Buffer.from(bintools.cb58Encode(unsignedTx.toBuffer())))
    const sig: Signature = new Signature()
    sig.fromBuffer(sigbuf)
    console.log(sig.toString())
    
    const returndata = {
        joinid,
        "messagetype": 4,
        signature: sig,
        pubaddr: pubaddr
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

const data = {"inputs": [{"coinid": 1, "amount": 13, "transactionid": "dabface", "transactionoffset": 2, "pubaddr": "X-avax1sqxw2yrkja9cvmj2gzxtw0km3aw2eq99g47qtx"}, {"coinid": 1, "amount": 12, "transactionid": "0123456789abcdef0123456789abcde9", "transactionoffset": 2, "pubaddr": "X-avax1sqxw2yrkja9cvmj2gzxtw0km3aw2eq99g47qtx"}, {"coinid": 1, "amount": 15, "transactionid": "0123456789abcdef0123456789abcdef", "transactionoffset": 2, "pubaddr": "X-avax1sqxw2yrkja9cvmj2gzxtw0km3aw2eq99g47qtx"}], 
"outputs": [{"coinid": 1, "amount": 10, "destinationaddr": "X-avax1sqxw2yrkja9cvmj2gzxtw0km3aw2eq99g47qtx"}, {"coinid": 1, "amount": 10, "destinationaddr": "X-avax1sqxw2yrkja9cvmj2gzxtw0km3aw2eq99g47qtx"}, {"coinid": 1, "amount": 10, "destinationaddr": "X-avax1sqxw2yrkja9cvmj2gzxtw0km3aw2eq99g47qtx"}, {"coinid": 1, "amount": 10, "destinationaddr": "X-avax1sqxw2yrkja9cvmj2gzxtw0km3aw2eq99g47qtx"}]}

const myPrivKey = "PrivateKey-24b2s6EqkBp9bFG5S3Xxi4bjdxFqeRk56ck7QdQArVbwKkAvxz"

sendsignature(6, data, "X-avax15s7p7mkdev0uajrd0pzxh88kr8ryccztq9fct8", myPrivKey)