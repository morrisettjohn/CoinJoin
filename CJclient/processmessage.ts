import { request } from "http"
import { extract_host, extract_port } from "./utils"
import { Buffer } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche" 
import { UnsignedTx } from "@avalabs/avalanche-wallet-sdk/node_modules/avalanche/dist/apis/avm"

//class that creates a message used to parse communications from the cj server
class Message {
    message_type: string
    message_data: any
    message_resolve: string
    private cache_timeout: number
    static message_types = ["MSG", "ERR", "OPT", "JLS", "JDT", "NCE", "WTX", "STX", "TXD", "UND", "LOG"]
    static resolve_types = ["cache", "return", "print", "log"]
    constructor (message_type?: string, message_data?: any, message_resolve?: string, cache_timeout?: number){
        this.message_type = message_type
        this.message_data = message_data
        this.message_resolve = message_resolve
        if (this.message_resolve == "cache"){
            this.cache_timeout = cache_timeout
        }
        else {
            this.cache_timeout = undefined
        }
    }
    set_cache_timeout(mlsecs: number) {
        if (this.message_resolve = "cache"){
            this.cache_timeout = mlsecs
        }
        else {
            throw new Error("can only apply a cache_timeout")
        }
    }
    get_cache_timeout(){
        return this.cache_timeout
    }
}

const is_valid_join_data = function(data: any): boolean {
    if ("ID" in data && "asset_name" in data && "asset_ID" in data && "network_ID" in data &&
    "state" in data && "input_limit" in data && "input_amount" in data && "output_amount" in data && 
    "fee_percent" in data && "join_tx_ID" in data && "fee_addr" in data && "last_accessed" in data) {
        return true
    }
    return false
}

//takes a message from the coinjoin server and processes it, using a 3 character prefix as a message_type
const process_message = function (recieved_data: string): Message[]{
    let messages: Message[] = []
    while (recieved_data.indexOf("\r\n\r\n") != -1){

        const end_index: number = recieved_data.indexOf("\r\n\r\n")
        const message_type: string = recieved_data.slice(0, 3)
        const message_data: string = recieved_data.slice(3, end_index)
        const message: Message = new Message(message_type)

        recieved_data = recieved_data.slice(end_index + 4)
        //handling message
        if (message_type == "MSG"){
            message.message_data = "SERVER MESSAGE: " + message_data
            message.message_resolve = "print"
        }           
        //handling error message
        else if (message_type == "ERR"){
            message.message_data = "ERROR: " + message_data
            message.message_resolve = "print"
        }
        //handling get_options data
        else if (message_type == "OPT"){
            message.message_data= JSON.parse(message_data)
            message.message_resolve = "print"
        }
        //handling get_join_list data
        else if (message_type == "JLS"){
            message.message_data = JSON.parse(message_data)
            message.message_resolve = "return"
        }
        //handles the join data
        else if (message_type == "JDT"){
            const data = JSON.parse(message_data)
            if (is_valid_join_data(data)) {
                message.message_data = JSON.parse(message_data)
                message.message_resolve = "return"
            } else {
                console.log("join data missing entries")
            }
        }
        //handles the nonce data
        else if (message_type == "NCE"){
            message.message_data = JSON.parse(message_data)
            message.message_resolve = "return"
        }
        //handling send_utxo data
        else if (message_type == "WTX"){
            const data = JSON.parse(message_data)
            message.message_data = data
            message.message_resolve = "return"

        }
        //handling signed_tx data
        else if (message_type == "STX"){
            const data = JSON.parse(message_data)

            message.message_data = data["stx"]
            message.message_resolve = "cache"
            message.set_cache_timeout(data["timeout"])
        }
        else if (message_type == "TXD"){
            message.message_data = message_data
            message.message_resolve = "return"
        }
        else {
            message.message_type = "UND"
            message.message_data = undefined
        }
        messages.push(message)
    }
    return messages
}

//based on the content of a message, constructs the header options
const construct_header_options = function (content: any, ip: string): any{
    const options = {
        host: extract_host(ip),
        port: extract_port(ip),
        method: "POST",
        headers: {
            "Content-Length": Buffer.byteLength(content)
        }
    }
    return options
}

//main send/recieve function for communicating with the cj server.  Sends over a message, and recieves responses from the server
const send_recieve = function (sendData: any, ip: string): Promise<any[]> {
    const return_data_string = JSON.stringify(sendData)
    const options = construct_header_options(return_data_string, ip)

    return new Promise((resolve, reject) => {
        const cache = []
        let timeout = undefined

        //construct a request based on the option data above, and then write to it
        const req = request(options, res => {

            //once the request has recieved data, parse the data
            res.on("data", d => {
                let recieved_data = d.toString()

                //multiple different messages may be sent in one packet.  Handle each message
                const messages = process_message(recieved_data)
                messages.forEach(item => {
                    //if the message is one that prints out information to the console, just print it out.  Do not cache information
                    if (item.message_resolve == "print"){
                        console.log(item.message_data)
                    }
                    //if the message requires that the results be returned, resolve the promise
                    else if (item.message_resolve == "return"){
                        cache.push(item.message_data)
                        resolve(cache)
                    }
                    //if the message requires that the results be cached, store that information in the promise cache.
                    //if the message has a cachetimeout, then the cache will be returned either when:
                    //1. a message with a return resolve has been accepted
                    //2. the number of mllseconds specified in the cachetimeout has passed
                    else if (item.message_resolve == "cache"){
                        cache.push(item.message_data)
                        if (item.get_cache_timeout()){
                            if (!timeout || timeout > item.get_cache_timeout()){
                                timeout = item.get_cache_timeout()
                            }
                        }
                    }
                })
                if (timeout){
                    setTimeout(() => {resolve(cache)}, timeout)
                }
            })
        })
        req.write(return_data_string)
        req.end()
    })
    
}

export { process_message, construct_header_options, send_recieve }