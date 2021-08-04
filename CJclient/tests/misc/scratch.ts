const sendutxodata = async(join_ID: number, asset_ID: string, input_amount: number, 
    output_amount: number, dest_addr: string, private_key: string, network_ID: number): Promise<any> => {
    const network_data = generate_xchain(network_ID)
    const xchain = network_data.xchain
    const asset_ID_buf: Buffer = bintools.cb58Decode(asset_ID)

    //get the input and output amounts
    const fee: BN = xchain.getDefaultTxFee()
    const inp_amount: BN = new BN(input_amount*BNSCALE)
    const inp_amount_fee: BN = inp_amount.add(fee)

    const out_amount: BN = new BN(output_amount*BNSCALE)

    const key_type = get_key_type(private_key)
    
    let pub_addr = ""
    let id = ""
    let signed_tx: Tx = new Tx()
    let my_addres: string[] = []
    let pub_addr_buf: Buffer[] = []
    if (key_type == 0){  //for private keys
        const key_data = generate_key_chain(network_data.xchain, private_key)
        my_addres = key_data.my_addr_strings
        pub_addr_buf = key_data.pub_addr_buf
        pub_addr = xchain.addressFromBuffer(pub_addr_buf[0])

        //get utxos
        const utxo_set: UTXOSet = (await xchain.getUTXOs(pub_addr)).utxos
        const balance: BN = utxo_set.getBalance(pub_addr_buf, asset_ID)

        if (balance.gte(inp_amount_fee)) {
            const unsigned_tx = await xchain.buildBaseTx(utxo_set, inp_amount, asset_ID, my_addres, my_addres, my_addres)
            signed_tx = unsigned_tx.sign(key_data.x_key_chain)

        } else {
            console.log("insufficient funds")
            throw Error //XXX fix this later
        }
    }

    else if (key_type == 1){  //for mnemonics
        const my_wallet = MnemonicWallet.fromMnemonic(private_key)
        await my_wallet.resetHdIndices()
        await my_wallet.updateUtxosX()
        const from = my_wallet.getAllAddressesX()
        const to = my_wallet.getAddressX()
        const change = my_wallet.getChangeAddressX()
        const wallet_utxos: any = my_wallet.utxosX
        
        if (my_wallet.getBalanceX()[asset_ID].unlocked.gte(inp_amount_fee)){
            const unsigned_tx = await xchain.buildBaseTx(wallet_utxos, inp_amount, asset_ID, [to], from, [change])
            signed_tx = await my_wallet.signX(unsigned_tx)
        }
        else{
            throw Error("insufficient funds in wallet")
        }
    }
    id = await xchain.issueTx(signed_tx)
    console.log("issued")

    let status: string = ""
    while (status != "Accepted" && status != "Rejected"){
        status = await xchain.getTxStatus(id)
    }

    if (status === "Rejected"){
        throw Error("rejected, not submitting to coinjoin")
    }

    console.log("Accepted")

    const outs = signed_tx.getUnsignedTx().getTransaction().getOuts()

    let tx_index = 0
    for (let i = 0; i < outs.length; i++){
        if (outs[i].getOutput().getAmount().eq(inp_amount)){
            break
        }
        tx_index += 1
    }

    pub_addr_buf = [signed_tx.getUnsignedTx().getTransaction().getOuts()[tx_index].getOutput().getAddress(0)]
    pub_addr = xchain.addressFromBuffer(pub_addr_buf[0])
    
    console.log("constructing my input")
    
    //construct input
    const tx_ID: Buffer = bintools.cb58Decode(id)
    const output_idx = Buffer.alloc(4)
    output_idx.writeIntBE(tx_index, 0, 4)

    const secp_transfer_input:  SECPTransferInput = new SECPTransferInput(inp_amount)
    secp_transfer_input.addSignatureIdx(0, pub_addr_buf[0])
    const input:  TransferableInput = new TransferableInput(tx_ID, output_idx, asset_ID_buf, secp_transfer_input)

    console.log("constructing my output")

    const output_addr_buf: Buffer[] = [xchain.parseAddress(dest_addr)]
    const secp_tranfser_output: SECPTransferOutput = new SECPTransferOutput(out_amount, output_addr_buf)
    const output: TransferableOutput = new TransferableOutput(asset_ID_buf, secp_tranfser_output)

    const ticket = await requestNonce(join_ID, pub_addr, private_key, network_ID)

    const send_data = {
        "join_ID": join_ID,
        "message_type": consts.COLLECT_INPUTS,
        "pub_addr": pub_addr,
        "ticket": ticket,
        "input_buf": input.toBuffer(),
        "output_buf": output.toBuffer(),
    }

    console.log("sending data to coinjoin server now")

    const recieved_data = (await send_recieve(send_data))[0]
    const log_data = `successfully joined CJ of id ${join_ID} using address ${pub_addr}.`
    console.log(log_data)
    log_info(log_data)

    return [recieved_data, input, output, pub_addr]
}