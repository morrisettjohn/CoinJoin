//function that requests a nonce from the cj server for validation

import {
    Buffer,
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { send_recieve } from "./processmessage";
import * as consts from "./constants"
import { generate_key_chain, generate_xchain, get_key_type } from "../avalancheutils";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";

const request_nonce = async(join_ID: number, pub_addr: string, private_key: string, network_ID: number, ip: string): Promise<any> => {
    const network_data = generate_xchain(network_ID)
    const key_type = get_key_type(private_key)

    //construct half of the nonce that the server will use for validation
    const half_server_nonce = generate_nonce()
    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.REQUEST_TO_JOIN,
        "pub_addr": pub_addr,
        "server_nonce": half_server_nonce
    }
    
    //wait for the server to send back nonce information for the user to sign
    const nonce_data = (await send_recieve(send_data, ip))[0]

    //the server's nonce informaiton
    const server_nonce: string = nonce_data["server_nonce"]
    const server_sig = nonce_data["server_sig"]
    const server_pub_addr = nonce_data["server_pub_addr"]

    //if the server nonce doesn't start with the nonce the user provided, they may be using an old nonce.  Throw an error
    if (!server_nonce.startsWith(half_server_nonce)) {
        throw new Error("server nonce does not start with provided nonce")
    }

    //validate the server's nonce
    const dummy_pair = network_data.xchain.keyChain().makeKey()
    const nonce_addr_buf = dummy_pair.addressFromPublicKey(dummy_pair.recover(Buffer.from(server_nonce), Buffer.from(server_sig)))
    const nonce_addr = network_data.xchain.addressFromBuffer(nonce_addr_buf)

    if (nonce_addr != server_pub_addr) {
        throw new Error("recovered address does not match to server address")
    }

    //construct the client's nonce
    const recieved_nonce: string = nonce_data["nonce"]
    const my_nonce: string = generate_nonce()
    const full_nonce = recieved_nonce + my_nonce
    const full_nonce_buf = new Buffer(full_nonce)
    
    //sign the new nonce
    let sig: Buffer = undefined
    if (key_type == 0){
        const key_data = generate_key_chain(network_data.xchain, private_key)
        sig = key_data.my_key_pair.sign(full_nonce_buf)
    }
    else if (key_type == 1){
        const my_wallet = MnemonicWallet.fromMnemonic(private_key)
        await my_wallet.resetHdIndices()
        my_wallet.getKeyChainX()
        const my_key = my_wallet.getKeyChainX().getKey(network_data.xchain.parseAddress(pub_addr))
        sig = my_key.sign(full_nonce_buf)
    }
    return [full_nonce, sig]
}

//generates a 5 digit nonce
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const NONCE_LENGTH = 5
const generate_nonce = function() {
    let return_nonce = ""
    for (let i = 0; i < NONCE_LENGTH; i++){
        return_nonce += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length))
    }
    return return_nonce
}

export {request_nonce}