var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const common_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common")
const { generatexchain } = require("../../CJclient/avalancheutils");
const { createHash } = require("crypto")

process.stdin.on("data", data => processData(data))

const processData = function(data) {

    data = JSON.parse(data)



    const pubaddr = data["pubaddr"]
    const sigbuf = avalanche_1.Buffer.from(data["sig"])
    const sig = new common_1.Signature()
    sig.fromBuffer(sigbuf)

    const utx = avalanche_1.Buffer.from(data["utx"])
    const utxbuf = Buffer.from(createHash("sha256").update(utx).digest())
    const networkID = data["networkID"]
    const networkData = generatexchain(networkID)

    const keyPair = new avm_1.KeyPair()
    const newpub = keyPair.recover(utxbuf, sigbuf)
    const newPubBuf = keyPair.addressFromPublicKey(newpub)
    const pubaddrBuf = networkData.xchain.parseAddress(pubaddr)

    process.stdout.write(newPubBuf.equals(pubaddrBuf).toString())
}

