import * as bech32 from "bech32"
import { BinTools, Buffer} from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { generatexchain } from "../avalancheutils"
import { XChainAlias } from "avalanche/dist/utils"


const bintools: BinTools = BinTools.getInstance()

const x = generatexchain(5)
const testaddr = "X-fuji1xam3qzr4t752khj5kpg6ezz9nm42e4ffsyylzz"
const converty = "8iZHCsqMx3LS97bLKNrWufviwkNf2TXKD"


const words1 = x.xchain.parseAddress(testaddr)


const y = bintools.cb58Decode(converty)
console.log("hi\r\n\r\n")



/*let teststring = ""
words.forEach(item => {
    teststring += ALPHABET[item]
})
console.log(teststring)

x.xchain.parseAddress()*/



//64GoAhMjv7ri2bBLLEaQNJMEDVN8XGBbP
//7LfaaqM8qxGW5nN5xCHqfMyfLABro7H8g