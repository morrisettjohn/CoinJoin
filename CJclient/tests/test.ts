import {
  Avalanche,
  BinTools,
  Buffer,
  BN
} from "avalanche" 
import { 
  AVMAPI,
  UTXOSet,
  UTXO,
  UnsignedTx,
  BaseTx,
  TransferableInput,
  TransferableOutput,
  AmountOutput,
  AmountInput,
  SECPTransferInput,
  SECPTransferOutput,
  KeyChain,
  Tx
} from "avalanche/dist/apis/avm";
import { request } from "http"
import {
  Defaults
}from "avalanche/dist/utils"


/*const data = {
  "joinid": 6,
  "assetid": "23wKfz3viWLmjWo2UZ7xWegjvnZFenGAVkouwQCeB9ubPXodG6",
  "assetamount": 10,
  "destinationaddr": "feec1",
  "pubaddr": "X-avax1slt2dhfu6a6qezcn5sgtagumq8ag8we75f84sw"
}*/

//setting up the xchain object
const BNSCALE: number = 1000000000
const bintools: BinTools = BinTools.getInstance()
const Ip: string = "api.avax.network"
const networkID: number = 1
const port: number = 443
const protocol: string = "https"
const xchainid: string = Defaults.network[networkID].X.blockchainID
const xchainidBuf: Buffer = bintools.cb58Decode(xchainid)
const avax: Avalanche = new Avalanche(Ip, port, protocol, networkID);
avax.setRequestConfig('withCredentials', true)
const xchain: AVMAPI = avax.XChain(); //returns a reference to the X-Chain used by AvalancheJS


const main = async(): Promise<any> => {
  const x: Tx = new Tx()
  x.fromString(await xchain.getTx("2CiKBh5NSeUUfPo3Dobz2AQDcLvykAdxJgLddCJX9XUkApw3SK"))

  console.log(x)

  console.log(x.getUnsignedTx().getTransaction().getIns()[0].getInput().getSigIdxs()[0].toString())
}

main()