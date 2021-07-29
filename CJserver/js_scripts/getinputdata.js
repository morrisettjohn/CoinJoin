var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generatexchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => processData(data))

const bintools = avalanche_1.BinTools.getInstance()

const processData = async(data) => {
    data = JSON.parse(data)

    const networkData = generatexchain(data["networkID"])
    const pubaddr = data["pubaddr"]

    const input_buf = new avalanche_1.Buffer(data["inpBuf"])
    const input = new avm_1.TransferableInput()
    input.fromBuffer(input_buf)

    const inputTxID = bintools.cb58Encode(input.getTxID())
    const inputTxIndex = new avalanche_1.BN(input.getOutputIdx()).toNumber()
    
    const inputTxString = await networkData.xchain.getTx(inputTxID)
    const inputTx = new avm_1.Tx()
    inputTx.fromString(inputTxString)
    const inputBaseTx = inputTx.getUnsignedTx().getTransaction()
    if (inputBaseTx.getOuts()[inputTxIndex].getOutput().getAddresses().length > 1){
        throw new Error("output should not have more than one recipient")
    }
    const inputAddress = networkData.xchain.addressFromBuffer(inputBaseTx.getOuts()[inputTxIndex].getOutput().getAddress(0))

    if (pubaddr != inputAddress){
        throw new Error("the pubaddr provided and the input associated with the actual input differ")
    }

    

    
    const amount = input.getInput().getAmount().toString()
    const assetID = bintools.cb58Encode(input.getAssetID())

    const returnData = JSON.stringify({"amt": amount, "assetid": assetID})

    process.stdout.write(returnData)
}