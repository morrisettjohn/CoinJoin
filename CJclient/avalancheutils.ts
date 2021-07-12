import {
    Avalanche,
    Buffer,
    BinTools
} from "avalanche"
import { AVMAPI, KeyChain } from "avalanche/dist/apis/avm"
import { Defaults } from "avalanche/dist/utils"

const bintools: BinTools = BinTools.getInstance()

const generatexchain = function(networkID: number){
    let Ip = ""
    let port = 0
    let protocol = ""
    if (networkID == 5){
        Ip = "api.avax-test.network"
        port = 443
        protocol = "https"
    }
    else if (networkID == 1){
        Ip = "api.avax.network"
        port = 443
        protocol = "https"
    }
    const xchainid: string = Defaults.network[networkID].X.blockchainID
    const xchainidBuf: Buffer = bintools.cb58Decode(xchainid)

    const avax: Avalanche = new Avalanche(Ip, port, protocol, networkID, xchainid)
    avax.setRequestConfig('withCredentials', true)
    const xchain: AVMAPI = avax.XChain()
    return {"xchainid": xchainid, "xchain": xchain, xchainidBuf}
}

const generatekeychain = function(xchain: AVMAPI, privatekey: string){
    const xKeyChain: KeyChain = xchain.keyChain();
    const myKeyPair = xKeyChain.importKey(privatekey)
    const myAddressBuf = xchain.keyChain().getAddresses()
    const myAddressStrings = xchain.keyChain().getAddressStrings()

    return {"xKeyChain": xKeyChain, "myKeyPair": myKeyPair, "myAddressBuf": myAddressBuf, "myAddressStrings": myAddressStrings}
}

export {generatexchain, generatekeychain}