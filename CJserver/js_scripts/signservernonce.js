var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var wallet_1 = require("@avalabs/avalanche-wallet-sdk")
var crypto_1 = require("crypto");
const { generate_xchain, get_key_type, generate_key_chain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => process_data(data))

const bintools = avalanche_1.BinTools.getInstance()

const process_data = async(data) => {
    data = JSON.parse(data)
    const server_nonce = Buffer.from(data["server_nonce"])
    const private_key = data["priv_key"]
    const network_data = generate_xchain(data["network_ID"])
    const key_data = generate_key_chain(network_data.xchain, private_key)
    
    const server_sig = key_data.my_key_pair.sign(server_nonce)
    const x = key_data.my_key_pair
    
    const return_data = JSON.stringify({"server_sig": server_sig})

    process.stdout.write(return_data)
}

