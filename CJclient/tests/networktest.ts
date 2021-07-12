import { TransferableInput, Tx, UTXO, UTXOSet, KeyChain } from "avalanche/dist/apis/avm"
import { generatekeychain, generatexchain } from "../avalancheutils"
import { Buffer } from "avalanche"
import { Mnemonic } from "avalanche"
import { randomBytes } from "crypto"
import { HDNode } from "avalanche"
import { Wallet } from "ethers"
import { createHash } from "crypto"
import 'module-alias/register';

import MnemonicWallet from "../../avalanche-wallet/src/js/wallets/MnemonicWallet"

const mnemonicKey = "dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing"

const test = async(networkID: number): Promise<any> => {
    const mwallet = new MnemonicWallet(mnemonicKey)
    const current_key = mwallet.getCurrentKey()
    console.log(current_key)
}

const args = process.argv.slice(2)

//test(parseInt(args[0]))
test(5)