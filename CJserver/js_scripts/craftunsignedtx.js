var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generatexchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => processData(data))

const bintools = avalanche_1.BinTools.getInstance()

const processData = function(data){
    data = JSON.parse(data)

    const feeData = data["feedata"]
    
    const inputData = data["inputs"]
    const outputData = data["outputs"]
    const networkID = data["networkID"]

    const networkData = generatexchain(networkID)

    const inputs = []
    const outputs = []

    for (let i = 0; i < inputData.length; i++){
        const inputBuf = new avalanche_1.Buffer(inputData[i])
        const input = new avm_1.TransferableInput()
        input.fromBuffer(inputBuf)
        inputs.push(input)
    }
    for (let i = 0; i < outputData.length; i++){
        const outputBuf = new avalanche_1.Buffer(outputData[i])
        const output = new avm_1.TransferableOutput()
        output.fromBuffer(outputBuf)
        outputs.push(output)
    }

    const assetidBuf = bintools.cb58Decode(feeData["assetid"])

    const outputaddressBuf = [networkData.xchain.parseAddress(feeData["address"])]
    const secpTransferOutput = new avm_1.SECPTransferOutput(new avalanche_1.BN(feeData["amount"]), outputaddressBuf)
    const feeOutput = new avm_1.TransferableOutput(assetidBuf, secpTransferOutput)
    outputs.push(feeOutput)
    
    const baseTx = new avm_1.BaseTx (
        networkID,
        networkData.xchainidBuf,
        outputs,
        inputs,
    )
    
    const unsignedTx = new avm_1.UnsignedTx(baseTx)
    process.stdout.write(unsignedTx.toBuffer())
}

