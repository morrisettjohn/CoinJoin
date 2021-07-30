import {
    Buffer,
    BinTools
  } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { sendRecieve } from "./processmessage";
import * as consts from "./constants"
import { generatekeychain, generatexchain, getKeyType } from "./avalancheutils";
import { MnemonicWallet } from "@avalabs/avalanche-wallet-sdk";

const bintools: BinTools = BinTools.getInstance()

const requestNonce = async(joinid: number, pubaddr: string, privatekey: string, networkID: number): Promise<any> => {
    const networkData = generatexchain(networkID)
    const xchain = networkData.xchain
    const keyType = getKeyType(privatekey)

    const sendData = {
        "joinid": joinid,
        "messagetype": consts.REQUEST_TO_JOIN,
        "pubaddr": pubaddr,
    }

    const nonce: Buffer = Buffer.from((await sendRecieve(sendData))[0])

    let sig: Buffer = undefined
    if (keyType == 0){
        const keyData = generatekeychain(networkData.xchain, privatekey)
        sig = keyData.myKeyPair.sign(nonce)         
    }
    else if (keyType == 1){
        const mwallet = MnemonicWallet.fromMnemonic(privatekey)
        await mwallet.resetHdIndices()
        sig = mwallet.getSigFromUTX(nonce, mwallet.getExternalAddressesX().indexOf(pubaddr))
    }

    return sig
}

export {requestNonce}