var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const { generate_xchain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => process_data(data))

const process_data = function(data) {

    data = JSON.parse(data)

    const msg = avalanche_1.Buffer.from(data["msg"])
    const signed_msg = avalanche_1.Buffer.from(data["signed_msg"])
    const network_ID = data["network_ID"]
    const network_data = generate_xchain(network_ID)

    const key_pair = new avm_1.KeyPair()
    const nonce_addr_buf = key_pair.addressFromPublicKey(key_pair.recover(msg, signed_msg))
    const nonce_addr = network_data.xchain.addressFromBuffer(nonce_addr_buf)

    const return_data = JSON.stringify({"nonce_addr": nonce_addr})
    
    process.stdout.write(return_data)
}
