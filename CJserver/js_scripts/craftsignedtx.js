var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var platformvm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/platformvm")
var common_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/common")


process.stdin.on("data", data => processData(data))

const bintools = avalanche_1.BinTools.getInstance()

const processData = function(data){
    data = JSON.parse(data)

    const signatures = data["signatures"]
    const utx = data["utx"]

    const txbuff = new avalanche_1.Buffer(utx)
    const unsignedTx = new avm_1.UnsignedTx()
    unsignedTx.fromBuffer(txbuff)
    
    let credentialArray = []
    signatures.forEach((sig) => {
        const sigitem = new common_1.Signature()
        const sigbuf = new avalanche_1.Buffer(sig)
        sigitem.fromBuffer(sigbuf)
        const cred = new platformvm_1.SECPCredential([sigitem])
        credentialArray.push(cred)
    })

    const stx = new avm_1.Tx(unsignedTx, credentialArray)
    process.stdout.write(stx.toBuffer())
}