var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generatexchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => processData(data))

const bintools = avalanche_1.BinTools.getInstance()

const processData = function(data){
    data = JSON.parse(data)

    const networkData = generatexchain(data["networkID"])
    const output_buf = new avalanche_1.Buffer(data["outBuf"])
    const output = new avm_1.TransferableOutput()
    try {
        output.fromBuffer(output_buf)
    }
    catch (e) {
        throw new Error("could not form output")
    }
    
    const amount = output.getOutput().getAmount().toString()
    const assetID = bintools.cb58Encode(output.getAssetID())
    
    const outAddrLen = output.getOutput().getAddresses().length
    if (outAddrLen != 1){
        throw new Error("address has multiple out addresses associated with it")
    }

    const outputAddrBuf = output.getOutput().getAddress(0)
    const outputAddr = networkData.xchain.addressFromBuffer(outputAddrBuf)

    const returnData = JSON.stringify({"amt": amount, "assetID": assetID, "outputAddr": outputAddr})

    process.stdout.write(returnData)
}