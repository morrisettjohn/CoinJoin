var avm_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm");
var avalanche_1 = require("@avalabs/avalanche-wallet-sdk/node_modules/avalanche");
var wallet_1 = require("@avalabs/avalanche-wallet-sdk")
const { generate_xchain, get_key_type, generate_key_chain } = require("../../CJclient/avalancheutils");

process.stdin.on("data", data => process_data(data))

const bintools = avalanche_1.BinTools.getInstance()

const process_data = async(data) => {

    data = JSON.parse(data)

    const private_key = data["private_key"]
    const network_data = generate_xchain(data["network_ID"])
    
    const key_type = get_key_type(private_key)
    
    let pub_addr = undefined
    let priv_key = undefined
    if (key_type == 0) {
        const key_data = generate_key_chain(network_data.xchain, private_key)
        pub_addr = key_data.my_addr_strings[0]
        priv_key = private_key
    }
    else if (key_type == 1){
        const my_wallet = wallet_1.MnemonicWallet.fromMnemonic(private_key)
        await my_wallet.resetHdIndices()
        const addresses = my_wallet.getExternalAddressesX()
        if (addresses.length == 1) {
            pub_addr = my_wallet.getAddressX()

        }
        else {
            const index = addresses.length - 1
            pub_addr = addresses[index]
        }
        priv_key = my_wallet.getKeyChainX().getKey(network_data.xchain.parseAddress(pub_addr)).getPrivateKeyString()
    }

    const return_data = JSON.stringify({"pub_addr": pub_addr, "priv_key": priv_key})
    process.stdout.write(return_data)
}

