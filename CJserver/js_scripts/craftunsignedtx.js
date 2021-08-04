var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generate_xchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => process_data(data))

const bintools = avalanche_1.BinTools.getInstance()

const process_data = function(data){
    data = JSON.parse(data)

    const fee_data = data["fee_data"]
    
    const input_data = data["inputs"]
    const output_data = data["outputs"]
    const network_ID = data["network_ID"]

    const network_data = generate_xchain(network_ID)

    const inputs = []
    const outputs = []

    for (let i = 0; i < input_data.length; i++){
        const input_buf = new avalanche_1.Buffer(input_data[i])
        const input = new avm_1.TransferableInput()
        input.fromBuffer(input_buf)
        inputs.push(input)
    }
    for (let i = 0; i < output_data.length; i++){
        const output_buf = new avalanche_1.Buffer(output_data[i])
        const output = new avm_1.TransferableOutput()
        output.fromBuffer(output_buf)
        outputs.push(output)
    }

    const asset_ID_buf = bintools.cb58Decode(fee_data["asset_ID"])

    const fee_addr = [network_data.xchain.parseAddress(fee_data["address"])]
    const secp_fee_output = new avm_1.SECPTransferOutput(new avalanche_1.BN(fee_data["amount"]), fee_addr)
    const fee_output = new avm_1.TransferableOutput(asset_ID_buf, secp_fee_output)
    outputs.push(fee_output)
    
    const baseTx = new avm_1.BaseTx (
        network_ID,
        network_data.xchain_ID_buf,
        outputs,
        inputs,
    )
    
    const unsignedTx = new avm_1.UnsignedTx(baseTx)
    process.stdout.write(unsignedTx.toBuffer())
}

