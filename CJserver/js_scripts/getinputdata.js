var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generate_xchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => process_data(data))

const bintools = avalanche_1.BinTools.getInstance()

const process_data = async(data) => {
    
    data = JSON.parse(data)

    const newtork_data = generate_xchain(data["network_ID"])
    const input_buf = new avalanche_1.Buffer(data["inp_buf"])
    const input = new avm_1.TransferableInput()
    try {
        input.fromBuffer(input_buf)
    }
    catch (e){
        throw new Error("Could not form input")
    }

    const input_tx_ID = bintools.cb58Encode(input.getTxID())
    const input_tx_index = new avalanche_1.BN(input.getOutputIdx()).toNumber()

    let input_tx_string = ""
    try {
        input_tx_string = await newtork_data.xchain.getTx(input_tx_ID)
    }
    catch (e){
        throw new Error("Input was not found")
    }
    const input_tx = new avm_1.Tx()
    input_tx.fromString(input_tx_string)
    const input_base_tx = input_tx.getUnsignedTx().getTransaction()

    const input_address = newtork_data.xchain.addressFromBuffer(input_base_tx.getOuts()[input_tx_index].getOutput().getAddress(0))
    if (input.getInput().getSigIdxs().length > 1){
        throw new Error("address requires multiple signers")
    }

    const amount = input.getInput().getAmount().toString()
    const asset_ID = bintools.cb58Encode(input.getAssetID())

    const return_data = JSON.stringify({"amt": amount, "asset_ID": asset_ID, "pub_addr": input_address})

    process.stdout.write(return_data)
}