var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generatexchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => processData(data))

const processData = function(data) {

    data = JSON.parse(data)

    const pubaddr = data["pubaddr"]
    const ticket = avalanche_1.Buffer.from(data["ticket"])
    const nonce = avalanche_1.Buffer.from(data["nonce"])
    const networkID = data["networkID"]
    const networkData = generatexchain(networkID)

    const keyPair = new avm_1.KeyPair()
    const newpub = keyPair.recover(nonce, ticket)
    const newPubBuf = keyPair.addressFromPublicKey(newpub)
    const pubaddrBuf = networkData.xchain.parseAddress(pubaddr)
    
    process.stdout.write(newPubBuf.equals(pubaddrBuf).toString())
}

