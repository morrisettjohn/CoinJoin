import {
    Avalanche,
    Buffer,
    BinTools
} from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche"
import { AVMAPI, KeyChain } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"
import { Defaults } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/utils"
import { Network, NetworkConstants } from "@avalabs/avalanche-wallet-sdk"

const bintools: BinTools = BinTools.getInstance()

const generate_xchain = function(network_ID: number){
    let Ip = ""
    let port = 0
    let protocol = ""
    if (network_ID == 5){
        Ip = "api.avax-test.network"
        port = 443
        protocol = "https"
        Network.setNetwork(NetworkConstants.TestnetConfig)
    }
    else if (network_ID == 1){
        Ip = "api.avax.network"
        port = 443
        protocol = "https"
        Network.setNetwork(NetworkConstants.MainnetConfig)
    }
    const xchain_ID: string = Defaults.network[network_ID].X.blockchainID
    const xchain_ID_buf: Buffer = bintools.cb58Decode(xchain_ID)

    const avax: Avalanche = new Avalanche(Ip, port, protocol, network_ID, xchain_ID)
    avax.setRequestConfig('withCredentials', true)
    const xchain: AVMAPI = avax.XChain()
    return {"xchain_ID": xchain_ID, "xchain": xchain, xchain_ID_buf}
}

const generate_key_chain = function(xchain: AVMAPI, privatekey: string){
    const x_key_chain: KeyChain = xchain.keyChain();
    const my_key_pair = x_key_chain.importKey(privatekey)
    const my_addr_strings = [my_key_pair.getAddressString()]
    const my_addr_buf = [my_key_pair.getAddress()]

    return {"x_key_chain": x_key_chain, "my_key_pair": my_key_pair, "my_addr_buf": my_addr_buf, "my_addr_strings": my_addr_strings}
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