import {
    Avalanche,
    Buffer,
    BinTools
} from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche"
import { AVMAPI, KeyChain } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"
import { Defaults } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/utils"
import { Network, NetworkConstants } from "@avalabs/avalanche-wallet-sdk"

const bintools: BinTools = BinTools.getInstance()

const generate_xchain = function(networkID: number){
    let Ip = ""
    let port = 0
    let protocol = ""
    if (networkID == 5){
        Ip = "api.avax-test.network"
        port = 443
        protocol = "https"
        Network.setNetwork(NetworkConstants.TestnetConfig)
    }
    else if (networkID == 1){
        Ip = "api.avax.network"
        port = 443
        protocol = "https"
        Network.setNetwork(NetworkConstants.MainnetConfig)
    }
    const xchainid: string = Defaults.network[networkID].X.blockchainID
    const xchainidBuf: Buffer = bintools.cb58Decode(xchainid)

    const avax: Avalanche = new Avalanche(Ip, port, protocol, networkID, xchainid)
    avax.setRequestConfig('withCredentials', true)
    const xchain: AVMAPI = avax.XChain()
    return {"xchainid": xchainid, "xchain": xchain, xchainidBuf}
}

const generate_key_chain = function(xchain: AVMAPI, privatekey: string){
    const xKeyChain: KeyChain = xchain.keyChain();
    const myKeyPair = xKeyChain.importKey(privatekey)
    const myAddressBuf = xchain.keyChain().getAddresses()
    const myAddressStrings = xchain.keyChain().getAddressStrings()

    return {"xKeyChain": xKeyChain, "myKeyPair": myKeyPair, "myAddressBuf": myAddressBuf, "myAddressStrings": myAddressStrings}
}

const get_key_type = function(key: string){
    if (key.startsWith("PrivateKey-")){
        return 0
    }
    else if (key.split(" ").length == 24){
        return 1
    }
    else
        return -1
}

export {generate_xchain, generate_key_chain, get_key_type}