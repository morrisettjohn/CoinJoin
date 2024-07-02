//generates a new key pair based on the wallet or private key provided

var wallet_1 = require("@avalabs/avalanche-wallet-sdk")
const { generate_xchain, get_key_type, generate_key_chain } = require("../../avalancheutils");

process.stdin.on("data", data => process_data(data))

const process_data = async(data) => {
    data = JSON.parse(data)

    const private_key = data["private_key"]
    const network_data = generate_xchain(data["network_ID"])
    const key_type = get_key_type(private_key)
    
    //get the public and private keys
    let pub_addr = undefined
    let priv_key = undefined
    if (key_type == 0) { //if this is a standard private key, just return the public address from the private key
        const key_data = generate_key_chain(network_data.xchain, private_key)
        pub_addr = key_data.my_addr_strings[0]
        priv_key = private_key
    }
    else if (key_type == 1){ //if this is a wallet, return the active address on the xchain, and find the private key that matches
        const my_wallet = wallet_1.MnemonicWallet.fromMnemonic(private_key)
        await my_wallet.resetHdIndices()
        pub_addr = my_wallet.getAddressX()
        priv_key = my_wallet.getKeyChainX().getKey(network_data.xchain.parseAddress(pub_addr)).getPrivateKeyString()
    }

    const return_data = JSON.stringify({"pub_addr": pub_addr, "priv_key": priv_key})
    process.stdout.write(return_data)
}

