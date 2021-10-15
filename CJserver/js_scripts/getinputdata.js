//parse an input buffer provided by a user

var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generate_xchain } = require("../../avalancheutils");

process.stdin.on("data", data => process_data(data))

const bintools = avalanche_1.BinTools.getInstance()

const process_data = async(data) => {
    data = JSON.parse(data)

    const network_data = generate_xchain(data["network_ID"])
    const input_buf = new avalanche_1.Buffer(data["inp_buf"])

    //reconstruct the input from the buffer
    const input = new avm_1.TransferableInput()
    try {
        input.fromBuffer(input_buf)
    }
    catch (e){
        throw new Error("Could not form input")
    }

    //get the transaction id and index of the tx output from the input
    const input_tx_ID = bintools.cb58Encode(input.getTxID())
    const input_tx_index = new avalanche_1.BN(input.getOutputIdx()).toNumber()

    let input_tx_string = ""
    try {
        input_tx_string = await network_data.xchain.getTx(input_tx_ID)
    }
    catch (e){
        throw new Error("Input was not found" + " " + input_tx_ID)
    }

    //get the tx from the xchain, and parse the transaction info
    const input_tx = new avm_1.Tx()
    input_tx.fromString(input_tx_string)
    const input_base_tx = input_tx.getUnsignedTx().getTransaction()

    const input_address = network_data.xchain.addressFromBuffer(input_base_tx.getOuts()[input_tx_index].getOutput().getAddress(0))
    const user_utxos = (await network_data.xchain.getUTXOs(input_address)).utxos
    
    let utxo = undefined
    try {
        utxo = user_utxos.getUTXO(input.getUTXOID())
    }
    catch (e) {
        throw new Error("utxo was not found in the user's list")
    }

    if (input.getInput().getSigIdxs().length > 1){
        throw new Error("address requires multiple signers")
    }

    const amount = input_base_tx.getOuts()[input_tx_index].getOutput().getAmount().toString()
    const asset_ID = bintools.cb58Encode(input.getAssetID())

    const return_data = JSON.stringify({"amt": amount, "asset_ID": asset_ID, "pub_addr": input_address})

    process.stdout.write(return_data)
}