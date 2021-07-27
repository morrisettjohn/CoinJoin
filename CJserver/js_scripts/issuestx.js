var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generatexchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => processData(data))

const processData = async(data) => {
    data = JSON.parse(data)
    
    const stx = data["stx"]
    const networkID = data["networkID"]
    const networkData = generatexchain(networkID)

    const stxBuf = new avalanche_1.Buffer(stx)
    const signedTx = new avm_1.Tx()
    signedTx.fromBuffer(stxBuf)
    const id = await networkData.xchain.issueTx(signedTx)
    
    let status = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await networkData.xchain.getTxStatus(id)
    }
    const returnString = JSON.stringify({"id": id, "status": status})

    process.stdout.write(returnString)
}

