import { Tx as StandardTx} from "avalanche/dist/apis/avm"
import { generatekeychain, generatexchain } from "../../avalancheutils"
import { Buffer, Mnemonic, HDNode, BN, BinTools } from "avalanche"
import { randomBytes } from "crypto"
import { Wallet } from "ethers"
import { createHash } from "crypto"
import { BNSCALE } from "../../constants"
import { TransferableInput, TransferableOutput, Tx, UTXO, UTXOSet, KeyChain, SECPTransferInput, SECPTransferOutput, BaseTx, UnsignedTx} from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"



import {MnemonicWallet, Network, NetworkConstants} from "@avalabs/avalanche-wallet-sdk"
import { Address } from "avalanche/dist/common"
import { XChainAlias } from "avalanche/dist/utils"
import { bnToBig } from "@avalabs/avalanche-wallet-sdk/dist/utils"
import { WalletBalanceX } from "@avalabs/avalanche-wallet-sdk/dist/Wallet/types"
import { Defaults } from "avalanche/dist/utils"

const mnemonicKey = "dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing"
const bintools: BinTools = BinTools.getInstance()

const test = async(networkID: number): Promise<any> => {
    const networkData = generatexchain(5)
    
    const x = await networkData.xchain.getAVAXAssetID()
    const y = await networkData.xchain.getTx("2tVrsjNURvH7hF42y5cc8shsKSGWFhgK7D8GEsnaYiZVca7Bzu")

    const date: Date = new Date()
    console.log(date.toLocaleString())

    const p = new Tx()
    p.fromString(y)
    const z = p.getUnsignedTx().getTransaction().getIns()[0].getTxID()
    const nurt = p.getUnsignedTx().getTransaction().getIns()[0].getOutputIdx()
    const nurt2: BN = new BN(nurt)
    console.log(nurt2.toNumber())

    const b = bintools.cb58Encode(z)
    console.log(b)
    const a = await networkData.xchain.getTx(b)
    console.log(a)
}

const args = process.argv.slice(2)

//test(parseInt(args[0]))
test(5)