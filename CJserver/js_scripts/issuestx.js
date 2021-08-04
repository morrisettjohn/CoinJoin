var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generate_xchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => process_data(data))

const process_data = async(data) => {
    data = JSON.parse(data)
    
    const stx = data["stx"]
    const network_ID = data["network_ID"]
    const network_data = generate_xchain(network_ID)

    const stx_buf = new avalanche_1.Buffer(stx)
    const stx = new avm_1.Tx()
    stx.fromBuffer(stx_buf)
    const id = await network_data.xchain.issueTx(stx)
    
    let status = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await network_data.xchain.getTxStatus(id)
    }
    const return_data = JSON.stringify({"id": id, "status": status})

    process.stdout.write(return_data)
}

