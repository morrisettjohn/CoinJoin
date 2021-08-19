//get the output data from the user's provided buffer

var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generate_xchain } = require("../../avalancheutils");

process.stdin.on("data", data => process_data(data))

const bintools = avalanche_1.BinTools.getInstance()

const process_data = function(data){
    data = JSON.parse(data)

    const network_data = generate_xchain(data["network_ID"])
    const output_buf = new avalanche_1.Buffer(data["out_buf"])

    //reconstruct the output
    const output = new avm_1.TransferableOutput()
    try {
        output.fromBuffer(output_buf)
    }
    catch (e) {
        throw new Error("could not form output")
    }
    
    //parse the data from the output
    const amount = output.getOutput().getAmount().toString()
    const asset_ID = bintools.cb58Encode(output.getAssetID())
    
    if (output.getOutput().getAddresses().length > 1){
        throw new Error("output has multiple out address associated with it")
    }

    const output_addr_buf = output.getOutput().getAddress(0)
    const output_addr = network_data.xchain.addressFromBuffer(output_addr_buf)

    const return_data = JSON.stringify({"amt": amount, "asset_ID": asset_ID, "output_addr": output_addr})

    process.stdout.write(return_data)
}