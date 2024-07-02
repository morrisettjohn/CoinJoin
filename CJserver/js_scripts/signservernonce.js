//signs a nonce that the server uses to verify its own data

const { generate_xchain, generate_key_chain } = require("../../avalancheutils");

process.stdin.on("data", data => process_data(data))

const process_data = async(data) => {
    data = JSON.parse(data)

    const server_nonce = Buffer.from(data["server_nonce"])
    const private_key = data["priv_key"]
    const network_data = generate_xchain(data["network_ID"])
    const key_data = generate_key_chain(network_data.xchain, private_key)
    
    //sign the nonce
    const server_sig = key_data.my_key_pair.sign(server_nonce)
    const return_data = JSON.stringify({"server_sig": server_sig})

    process.stdout.write(return_data)
}

