import { generate_key_chain, generate_xchain } from "../../avalancheutils"
import * as consts from "../../constants"
import { request_nonce } from "../../requestnonce"
import {
    BinTools,
    Buffer
} from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { craft_input, craft_output } from "../../sendinputdata"
import { Tx } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"
import { send_recieve } from "../../processmessage"

const bintools = BinTools.getInstance()

const network_ID = 5
const network_data = generate_xchain(network_ID)
const avax_ID = "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK"
const random_asset_ID = "tavQgYcWe2PeASxiGsjbmGUSJsUXKMRUTNXaA3KTSi77NrzVv"

const private_key_good = "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2"
const good_key_data = generate_key_chain(network_data.xchain, private_key_good)
const good_pub_addr = good_key_data.my_addr_strings[0]

const private_key_bad = "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY"
const bad_key_data = generate_key_chain(network_data.xchain, private_key_bad)
const bad_pub_addr = bad_key_data.my_addr_strings[0]


const test_join_ID = 6
const test_ip = "100.64.15.72:65432"


const send_data = async() => {
    //various nonces
    /*const nonce_sig_pair = await request_nonce(test_join_ID, good_pub_addr, private_key_good, network_ID, test_ip)
    const good_nonce: string = nonce_sig_pair[0]
    const good_nonce_buf = new Buffer(good_nonce)
    const good_nonce_sig = nonce_sig_pair[1]
    

    const bad_nonce = "imbad" + good_nonce.slice(5)
    const bad_nonce_buf = new Buffer(bad_nonce)

    const bad_nonce_signed_by_good_key = good_key_data.my_key_pair.sign(bad_nonce_buf)
    const good_nonce_signed_by_bad_key = bad_key_data.my_key_pair.sign(good_nonce_buf)
    const garbage_signature = new Buffer("Several small species of creatures living in a cave")*/


    //various inputs
    const good_output = craft_output(1, avax_ID, "X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443", 5)
    

    const spent_input = craft_input(1.15, avax_ID, "2q4uXSdmGSDZUy2xNPfd57aH4vLgq1vxQzuaMG4gp8aBdAdrPB", 1, good_pub_addr, 5)
    const input_wrong_utxo = craft_input(1.15, avax_ID, "2SRZf59TwWfV4tEUgWjy23PuwPFsVrTnnEdHRB5g5cUd6sSNns", 0, good_pub_addr, 5)
    const input_wrong_asset_ID = craft_input(1.15, random_asset_ID, "2GYdNLKu8pYY51BM6JzDooBV9VUGh5kHmN7C6Gs3MbUi25hSUP", 0, good_pub_addr, 5)
    const input_not_owned = craft_input(1.15, avax_ID, "GKCWP1RcPJTK7YzQfjyKUUMwyMu1dm7qDp3rnkAVq6yZw8uvD", 1, good_pub_addr, 5)

    console.log(good_pub_addr)
    console.log(bad_pub_addr)
    
    /*const send_data = {
        "join_ID": test_join_ID,
        "message_type": consts.COLLECT_INPUTS,
        "pub_addr": good_pub_addr,
        "nonce": good_nonce,
        "nonce_sig": good_nonce_sig,
        "input_buf": spent_input.toBuffer(),
        "output_buf": good_output.toBuffer()
    }*/
    //const recieved_data = (await send_recieve(send_data, test_ip))[0]

    console.log(good_output.toBuffer().length)
    console.log(bintools.cb58Encode(good_output.toBuffer()).length)

}

send_data()






/*const send_data = {
    "join_ID": test_join_ID,
    "message_type": consts.COLLECT_INPUTS,
    "pub_addr": pub_addr,
    "nonce": nonce,
    "nonce_sig": nonce_sig,
    "input_buf": input.toBuffer(),
    "output_buf": output.toBuffer()
}*/