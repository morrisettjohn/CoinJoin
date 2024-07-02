//issues the stx to the xchian

var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generate_xchain } = require("../../avalancheutils");

process.stdin.on("data", data => process_data(data))

const process_data = async(data) => {
    data = JSON.parse(data)
    
    const stx_data = data["stx"]
    const network_ID = data["network_ID"]
    const network_data = generate_xchain(network_ID)

    //reconstruct the tx from the buffer
    const stx_buf = new avalanche_1.Buffer(stx_data)
    const stx = new avm_1.Tx()
    stx.fromBuffer(stx_buf)

    //issue the tx
    const ID = await network_data.xchain.issueTx(stx)
    let status = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await network_data.xchain.getTxStatus(ID)
    }
    const return_data = JSON.stringify({"ID": ID, "status": status})

    process.stdout.write(return_data)
}

