import { KeyPair, Tx as StandardTx} from "avalanche/dist/apis/avm"
import { generate_key_chain, generate_xchain } from "../../avalancheutils"
import { Buffer, Mnemonic, HDNode, BN, BinTools } from "avalanche"
import { randomBytes } from "crypto"
import { Wallet } from "ethers"
import { createHash } from "crypto"
import { BNSCALE } from "../../constants"
import { TransferableInput, TransferableOutput, Tx, UTXO, UTXOSet, KeyChain, SECPTransferInput, SECPTransferOutput, BaseTx, UnsignedTx} from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"



import {MnemonicWallet, Network, NetworkConstants, PublicMnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import { Address } from "avalanche/dist/common"
import { XChainAlias } from "avalanche/dist/utils"
import { bnToBig } from "@avalabs/avalanche-wallet-sdk/dist/utils"
import { WalletBalanceX } from "@avalabs/avalanche-wallet-sdk/dist/Wallet/types"
import { Defaults } from "avalanche/dist/utils"

const mnemonicKey = "dismiss spoon penalty gentle unable music buffalo cause bundle rural twist cheese discover this oyster garden globe excite kitchen rival diamond please clog swing"
const mnemonic2 = "defense seven hip situate stool outer float ball fine piano unable slim system ring path voyage rabbit inside power agree tomorrow rich fabric woman"
const bintools: BinTools = BinTools.getInstance()

const test = async(networkID: number): Promise<any> => {

    const wallet = MnemonicWallet.fromMnemonic(mnemonic2)
    console.log(wallet.getKeyChainX())

    const networkData = generate_xchain(5)
    const keyData = generate_key_chain(networkData.xchain, "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY")
    const xchain = networkData.xchain



    const tx: Tx = new Tx()
    const x = await networkData.xchain.getTx("2GBGr6CdKFpoDzd7YiS3Vu8XpRjUCqcxHvQ7EKTZBwy3zE8Gv2")
    tx.fromString(x)

    const z = tx.getUnsignedTx().getTransaction().getIns()[0].toBuffer()
    const v = tx.getUnsignedTx().getTransaction().getOuts()[0].toBuffer()

    console.log(z)
    const t = bintools.cb58Encode(z)
    console.log(t)
    console.log(bintools.cb58Decode(t))
    console.log(bintools.cb58Encode(new Buffer(t)))
    

    const y = Buffer.concat([z, v])
    const c = Buffer.from(createHash("sha256").update(new Buffer(y)).digest())
    const d = bintools.cb58Encode(c)


    const b = bintools.bufferToB58(z)
    const a = bintools.bufferToB58(y)

    const n = new Buffer(x)
    const m = Buffer.from(createHash("sha256").update(n).digest())

}

const hest = async() => {
    const networkData = generate_xchain(5)
    const wallet = MnemonicWallet.fromMnemonic(mnemonic2)
    console.log(wallet.getExternalAddressesX())
    const b = wallet.getKeyChainX()
    console.log(b.getAddressStrings())
    
}

const best = async() => {
    const networkData = generate_xchain(5)
    const t = "sport fee fever myself private monster ladder leaf ritual month near can exhaust skin weird morning umbrella earn stone orphan enemy dry party ecology"
    const z = MnemonicWallet.fromMnemonic(t)
    await z.resetHdIndices()
    const b = z.getKeyChainX()
    const v = networkData.xchain.parseAddress(z.getExternalAddressesX()[0])
    console.log(b.getKey(v))

}

const vest = async() => {
    const network_data = generate_xchain(5)
    const key_data = generate_key_chain(network_data.xchain, "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2")
    const time = new BN(new Date().getTime())
    const time_buf = Buffer.from(time.toBuffer())
    const sig = key_data.my_key_pair.sign(new Buffer("1"))
    const time_hash = Buffer.from(createHash("sha256").update(sig).digest("hex"))

    console.log(time_hash.toString().length)
    
}

vest()