import { KeyPair, Tx as StandardTx} from "avalanche/dist/apis/avm"
import { generate_key_chain, generate_xchain } from "../../avalancheutils"
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
    const networkData = generate_xchain(5)
    const keyData = generate_key_chain(networkData.xchain, "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY")
    const xchain = networkData.xchain

    const q = "MtyBi5hmr3Xan22cQcJ4a6E4Bd3i9hZiv4rC9dw9KYFpdoyGG"
    const u = "2GBGr6CdKFpoDzd7YiS3Vu8XpRjUCqcxHvQ7EKTZBwy3zE8Gv2"

    const output_idx = Buffer.alloc(4)
    output_idx.writeIntBE(1, 0, 4)
    const asset_ID = await xchain.getAVAXAssetID()

    const secpinput = new SECPTransferInput(new BN(1.01))
    const input = new TransferableInput(bintools.cb58Decode(u), output_idx, asset_ID, secpinput)

    const tx: Tx = new Tx()
    const x = await networkData.xchain.getTx("2GBGr6CdKFpoDzd7YiS3Vu8XpRjUCqcxHvQ7EKTZBwy3zE8Gv2")
    tx.fromString(x)
    const z = tx.getUnsignedTx().getTransaction().getIns()[0].getUTXOID()
    const v = tx.getUnsignedTx().getTransaction().getIns()[0].getTxID()
    const utxo = "E3uDJkVNtkH1Byoj7LPANd8mhXXtHq2WJodxRAL9wDvoYNz8a"
    const y: UTXOSet = (await networkData.xchain.getUTXOs("X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443")).utxos
    const n = y.getAllUTXOs()
    const b = y.getAllUTXOStrings()

    const e = y.getUTXO(input.getUTXOID())
    console.log(y.includes(e))
    
    console.log(input.getUTXOID())


}

const args = process.argv.slice(2)

//test(parseInt(args[0]))
test(5)