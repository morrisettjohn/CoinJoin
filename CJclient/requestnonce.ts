import {
    Buffer,
    BinTools
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { generate_key_chain, generate_xchain, get_key_type } from "./avalancheutils";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";

const bintools: BinTools = BinTools.getInstance()

const request_nonce = async(join_ID: number, pub_addr: string, private_key: string, network_ID: number): Promise<any> => {
    const network_data = generate_xchain(network_ID)
    const key_type = get_key_type(private_key)

    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.REQUEST_TO_JOIN,
        "pub_addr": pub_addr,
    }
    
    const recieved_nonce: string = (await send_recieve(send_data))[0]
    const my_nonce: string = generate_nonce()
    const full_nonce = recieved_nonce + my_nonce
    const full_nonce_buf = new Buffer(full_nonce)
    
    let sig: Buffer = undefined
    if (key_type == 0){
        const key_data = generate_key_chain(network_data.xchain, private_key)
        sig = key_data.my_key_pair.sign(full_nonce_buf)
    }
    else if (key_type == 1){
        const my_wallet = MnemonicWallet.fromMnemonic(private_key)
        await my_wallet.resetHdIndices()
        sig = my_wallet.getSigFromUTX(full_nonce_buf, my_wallet.getExternalAddressesX().indexOf(pub_addr))
    }
    return [full_nonce, sig]
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

const generate_nonce = function() {
    let return_nonce = ""
    for (let i = 0; i < 5; i++){
        return_nonce += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length))
    }
    return return_nonce
}

export {request_nonce}