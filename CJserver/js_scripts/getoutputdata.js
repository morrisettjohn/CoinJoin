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
    output.fromBuffer(output_buf)
    
    const amount = output.getOutput().getAmount().toString()
    const assetID = bintools.cb58Encode(output.getAssetID())
    
    const outAddrLen = output.getOutput().getAddresses().length
    const outputAddrBuf = output.getOutput().getAddress(0)
    const outputAddr = networkData.xchain.addressFromBuffer(outputAddrBuf)

    const returnData = JSON.stringify({"amt": amount, "assetid": assetID, "outAddrLen": outAddrLen})

    process.stdout.write(returnData)
}