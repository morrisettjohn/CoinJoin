var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generatexchain } = require("../CJclient/avalancheutils");
const networkData = generatexchain(5)

const args = process.argv.slice(2)
const pubaddr = args[0]
const ticket = avalanche_1.Buffer.from(JSON.parse(args[1]))
const nonce = avalanche_1.Buffer.from(args[2])

const keyPair = new avm_1.KeyPair()
const newpub = keyPair.recover(nonce, ticket)
const newPubBuf = keyPair.addressFromPublicKey(newpub)
const pubaddrBuf = networkData.xchain.parseAddress(pubaddr)


console.log(newPubBuf.equals(pubaddrBuf))