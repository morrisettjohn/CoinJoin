var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generatexchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => processData(data))

const processData = function(data) {

    data = JSON.parse(data)


    const msg = avalanche_1.Buffer.from(data["msg"])
    const signed_msg = avalanche_1.Buffer.from(data["signed_msg"])
    const networkID = data["networkID"]
    const networkData = generatexchain(networkID)

    const keyPair = new avm_1.KeyPair()
    const nonceAddrBuf = keyPair.addressFromPublicKey(keyPair.recover(msg, signed_msg))
    const nonceAddr = networkData.xchain.addressFromBuffer(nonceAddrBuf)

    const returnData = JSON.stringify({"nonceAddr": nonceAddr})
    
    process.stdout.write(returnData)
}
