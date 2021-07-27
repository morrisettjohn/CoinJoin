var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");

process.stdin.on("data", data => processData(data))

const bintools = avalanche_1.BinTools.getInstance()

const processData = function(data){
    data = JSON.parse(data)

    const output_buf = new avalanche_1.Buffer(data["outBuf"])
    const output = new avm_1.TransferableOutput()
    output.fromBuffer(output_buf)
    
    const amount = output.getOutput().getAmount().toString()
    const assetID = bintools.cb58Encode(output.getAssetID())

    const returnData = JSON.stringify({"amt": amount, "assetid": assetID})

    process.stdout.write(returnData)
}