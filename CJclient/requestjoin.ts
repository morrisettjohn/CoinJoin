import {
    Buffer,
    BinTools
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { sendRecieve } from "./processmessage";
import * as consts from "./constants"
import { generatekeychain, generatexchain, getKeyType } from "./avalancheutils";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";
import * as bech32 from "bech32"
import { Address } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common";

const bintools: BinTools = BinTools.getInstance()

const requestToJoin = async(joinid: number, pubaddr: string, privatekey: string, networkID: number): Promise<any> => {
    const networkData = generatexchain(networkID)
    const xchain = networkData.xchain
    const keyType = getKeyType(privatekey)

    const sendData = {
        "joinid": joinid,
        "messagetype": consts.REQUEST_TO_JOIN,
        "pubaddr": pubaddr,
    }

    const nonce: string = await sendRecieve(sendData)

    let sig: Buffer = undefined
    if (keyType == 0){
        const keyData = generatekeychain(networkData.xchain, privatekey)
        sig = keyData.myKeyPair.sign(Buffer.from(nonce))
        console.log(nonce)
        console.log(keyData.myKeyPair.verify(Buffer.from(nonce), sig))
        const z = keyData.myKeyPair.recover(Buffer.from(nonce), sig)
        console.log(keyData.myKeyPair.addressFromPublicKey(z))

         
    }
    else if (keyType == 1){
        const mwallet = MnemonicWallet.fromMnemonic(privatekey)
        await mwallet.resetHdIndices()
        mwallet.getAllAddressesX
        sig = Buffer.from(mwallet.signMessage(nonce, mwallet.getExternalAddressesX().indexOf(pubaddr)))
    }

    

    console.log("hiyo")

    return sig
}

export {requestToJoin}