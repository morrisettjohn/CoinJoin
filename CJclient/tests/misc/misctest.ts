import * as bech32 from "bech32"
import { BinTools, Buffer} from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { XChainAlias } from "avalanche/dist/utils"
import { ResponseObject } from "../../responseobject"


const y = new ResponseObject
const x = new ResponseObject("x", "hi")

console.log(x.messagetype)