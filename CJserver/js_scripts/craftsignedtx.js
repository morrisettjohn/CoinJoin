var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var platformvm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/platformvm")
var common_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common")


process.stdin.on("data", data => process_data(data))

const bintools = avalanche_1.BinTools.getInstance()

const process_data = function(data){
    data = JSON.parse(data)

    const sigs = data["sigs"]
    const wtx = data["wtx"]

    const wtx_buf = new avalanche_1.Buffer(wtx)
    const unsigned_tx = new avm_1.UnsignedTx()
    unsigned_tx.fromBuffer(wtx_buf)
    
    let credential_array = []
    sigs.forEach((sig) => {
        const sig_item = new common_1.Signature()
        const sig_buf = new avalanche_1.Buffer(sig)
        sig_item.fromBuffer(sig_buf)
        const cred = new platformvm_1.SECPCredential([sig_item])
        credential_array.push(cred)
    })

    const stx = new avm_1.Tx(unsigned_tx, credential_array)
    process.stdout.write(stx.toBuffer())
}