var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const common_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common")
const { generate_xchain } = require("../../CJclient/avalancheutils");
const { createHash } = require("crypto")

process.stdin.on("data", data => process_data(data))

const process_data = function(data) {

    data = JSON.parse(data)

    const sig_buf = avalanche_1.Buffer.from(data["sig"])
    const sig = new common_1.Signature()
    sig.fromBuffer(sig_buf)

    const utx = avalanche_1.Buffer.from(data["utx"])
    const utx_buf = Buffer.from(createHash("sha256").update(utx).digest())
    const network_ID = data["network_ID"]
    const network_data = generate_xchain(network_ID)

    const key_pair = new avm_1.KeyPair()
    const sig_pub_buf = key_pair.addressFromPublicKey(key_pair.recover(utx_buf, sig_buf))
    const sig_addr = network_data.xchain.addressFromBuffer(sig_pub_buf)

    const return_data = JSON.stringify({"sig_addr": sig_addr})

    process.stdout.write(return_data)
}

