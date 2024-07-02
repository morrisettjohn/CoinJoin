//parse a signature that a user has provided

var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
const common_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common")
const { generate_xchain } = require("../../avalancheutils");
const { createHash } = require("crypto")

process.stdin.on("data", data => process_data(data))

const process_data = function(data) {
    data = JSON.parse(data)

    const sig_buf = avalanche_1.Buffer.from(data["sig"])
    const sig = new common_1.Signature()
    sig.fromBuffer(sig_buf)

    //construct the hash of the wtx and verify
    const wtx = avalanche_1.Buffer.from(data["wtx"])
    const wtx_buf = Buffer.from(createHash("sha256").update(wtx).digest())
    const network_ID = data["network_ID"]
    const network_data = generate_xchain(network_ID)

    const key_pair = new avm_1.KeyPair()
    const sig_pub_buf = key_pair.addressFromPublicKey(key_pair.recover(wtx_buf, sig_buf))
    const sig_addr = network_data.xchain.addressFromBuffer(sig_pub_buf)

    const return_data = JSON.stringify({"sig_addr": sig_addr})

    process.stdout.write(return_data)
}

