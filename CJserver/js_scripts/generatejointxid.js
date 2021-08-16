var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
import  Buffer from "@avalabs/avalanche-wallet-sdk"
var crypto_1 = require("crypto");
//const { generate_xchain, generate_key_chain } = require("../../CJclient/avalancheutils");

process.exit()
process.stdin.on("data", data => process_data(data))

const bintools = avalanche_1.BinTools.getInstance()

const process_data = function(data) {
    /*data = JSON.parse(data)

    const private_key = data["private_key"]
    const network_data = generate_xchain(data["network_ID"])
    const key_data = generate_key_chain(network_data.xchain, private_key)

    const time = new avalanche_1.BN(new Date().getTime())
    const time_nonce = avalanche_1.Buffer.from(time.toBuffer())

    const sig = bintools.cb58Encode(key_data.my_key_pair.sign(time_nonce))
    const sig_buf = bintools.cb58Decode(sig)

    const time_hash = avalanche_1.Buffer.from(crypto_1.createHash("sha256").update(sig).digest("hex"))
    const join_tx_ID = time_hash.toString()
    
    const return_data = JSON.stringify({"join_tx_ID": join_tx_ID, "time_sig": sig_buf, "time_nonce": time_nonce})
    process.stdout.write(return_data)*/
}

