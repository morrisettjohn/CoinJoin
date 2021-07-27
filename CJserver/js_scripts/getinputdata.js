var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");

process.stdin.on("data", data => processData(data))

const bintools = avalanche_1.BinTools.getInstance()

const processData = function(data){
    data = JSON.parse(data)

    const input_buf = new avalanche_1.Buffer(data["inpBuf"])
    const input = new avm_1.TransferableInput()
    input.fromBuffer(input_buf)
    
    const amount = input.getInput().getAmount().toString()
    const assetID = bintools.cb58Encode(input.getAssetID())

    const returnData = JSON.stringify({"amt": amount, "assetid": assetID})

    process.stdout.write(returnData)
}