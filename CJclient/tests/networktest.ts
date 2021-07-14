import { Tx as StandardTx} from "avalanche/dist/apis/avm"
import { generatekeychain, generatexchain } from "../avalancheutils"
import { Buffer, Mnemonic, HDNode, BN, BinTools } from "avalanche"
import { randomBytes } from "crypto"
import { Wallet } from "ethers"
import { createHash } from "crypto"
import { BNSCALE } from "../constants"
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
    const xchain = networkData.xchain
    const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
    Network.setNetwork(NetworkConstants.TestnetConfig)  //if you want to switch pass it through again
    const mwallet = MnemonicWallet.fromMnemonic(mnemonicKey)
    await mwallet.resetHdIndices()
    await mwallet.updateUtxosX()
    const outputaddressBuf: Buffer[] = [xchain.parseAddress(mwallet.getAddressX())]

    const id = "Lj6TJDDb7NVZM59YLZdpKsZDkF8Jw5Gqxuxgn5AxiCKTGZDMj"
    const txid: Buffer = bintools.cb58Decode(id)
    const outputidx = Buffer.alloc(4)
    outputidx.writeIntBE(0, 0, 4)
    const assetidBuf: Buffer = bintools.cb58Decode(avaxAssetID)
    const secpTransferInput:  SECPTransferInput = new SECPTransferInput(new BN(.689*BNSCALE))
    secpTransferInput.addSignatureIdx(0, xchain.parseAddress(mwallet.getAddressX()))
    const input:  TransferableInput = new TransferableInput(txid, outputidx, assetidBuf, secpTransferInput)
    
    console.log("constructing my output")

    const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(new BN(.688*BNSCALE), outputaddressBuf)
    const output: TransferableOutput = new TransferableOutput(assetidBuf, secpTransferOutput)

    const baseTx: BaseTx = new BaseTx(5, networkData.xchainidBuf, [output], [input])
    const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)

    const txbuff = unsignedTx.toBuffer()
    mwallet.resetHdIndices()
    const tx = await mwallet.signX(unsignedTx)
    const standardTx = new StandardTx()

    standardTx.fromString(tx.toString())
    xchain.issueTx(standardTx)
    

}

const args = process.argv.slice(2)

//test(parseInt(args[0]))
test(5)