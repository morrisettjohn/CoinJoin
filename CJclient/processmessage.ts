import { request } from "http"
import * as consts from "./constants"

class Message {
    mtype: string
    mdata: any
    mresolve: string
    private cachetimeout: number
    static messagetypes = ["MSG", "ERR", "OPT", "JLS", "JDT", "NCE", "WTX", "STX", "TXD", "UND"]
    static resolvetypes = ["cache", "return", "print"]
    constructor (mtype?: string, mdata?: any, mresolve?: string, cachetimeout?: number){
        this.mtype = mtype
        this.mdata = mdata
        this.mresolve = mresolve
        if (this.mresolve == "cache"){
            this.cachetimeout = cachetimeout
        }
        else {
            this.cachetimeout = undefined
        }
    }
    setCacheTimeout(mlSecs: number) {
        if (this.mresolve = "cache"){
            this.cachetimeout = mlSecs
        }
        else {
            throw new Error("can only apply a cachetimeout")
        }
    }
    getCacheTimeout(){
        return this.cachetimeout
    }
}

const isValidWTXData = function(data: any): boolean {
    return true
    if (!("inputs" in data && "outputs" in data)){
        return false
    }
    if (data["inputs"].length < 1 || data["outputs"].length < 1){
        return false
    }
    data["inputs"].forEach(item => {
        if (!("pubaddr" in item && "inputbuf" in item)){
            return false
        }
    })
    data["inputs"].forEach(item => {
        if (!("outputbuf" in item)){
            return false
        }
    })
    return true
}

const isValidSTX = function(data: any): boolean {
    return true
    /*XXX fix later
    if (!("signatures" in data && "transaction" in data)){
        return false
    }
    if (data["signatures"].length < 1 || data["transaction"].length != 1){
        return false
    }
    return true*/
}

//takes a message from the coinjoin server and processes it, using a 3 character prefix as a messagetype
const processMessage = function (recievedData: string): Message[]{
    let messages: Message[] = []
    while (recievedData.indexOf("\r\n\r\n") != -1){

        const endIndex: number = recievedData.indexOf("\r\n\r\n")
        const messageType: string = recievedData.slice(0, 3)
        const messageData: string = recievedData.slice(3, endIndex)
        const message: Message = new Message(messageType)

        recievedData = recievedData.slice(endIndex + 4)
        //handling message
        if (messageType == "MSG"){
            message.mdata = "SERVER MESSAGE: " + messageData
            message.mresolve = "print"
        }           
        //handling error message
        else if (messageType == "ERR"){
            message.mdata = "ERROR: " + messageData
            message.mresolve = "print"
        }
        //handling get_options data
        else if (messageType == "OPT"){
            message.mdata= JSON.parse(messageData)
            message.mresolve = "print"
        }
        //handling get_joinlist data
        else if (messageType == "JLS"){
            let data = ""
            const joinlist = JSON.parse(messageData)
            for (let i = 0; i < joinlist.length; i++){
                data += joinDataReadable(joinlist[i])
            }
            message.mdata = data
            message.mresolve = "print"
        }
        else if (messageType == "JDT"){
            message.mdata = joinDataReadable(JSON.parse(messageData))
            message.mresolve = "print"
        }
        else if (messageType == "NCE"){
            message.mdata = messageData
            message.mresolve = "return"
        }
        //handling send_utxo data
        else if (messageType == "WTX"){
            const data = JSON.parse(messageData)
            if (isValidWTXData(data)){
                message.mdata = data
                message.mresolve = "return"
            }
            else {
                throw Error("Incomplete wtx")
            }
        }

        //handling signed_tx data
        else if (messageType == "STX"){
            const data = JSON.parse(messageData)
            if (isValidSTX(data)){
                message.mdata = data["stx"]
                message.mresolve = "cache"
                message.setCacheTimeout(data["timeout"])
            }
            else {
                throw new Error("incomplete stx")
            }
            
        }
        else if (messageType == "TXD"){
            message.mdata = messageData
            message.mresolve = "return"
        }
        else {
            message.mtype = "UND"
            message.mdata = undefined
        }
        messages.push(message)
    }
    return messages
}

const joinDataReadable = function(join: any) {
    let state = "Inputs"
    if (join["state"] == consts.COLLECT_SIGS){
        state = "Signatures"
    }
    let message = `Join ID: ${join["id"]}`
    message += `\n\tAsset Name: ${join["asset_name"]}`
    message += `\n\tBase amount: ${join["base_amount"]}`
    message += `\n\tTotal amount (with fees): ${join["total_amount"]}`
    message += `\n\tState: Collect ${state}`
    message += `\n\tTotal ${state} collected:  ${join["current_input_count"]}/${join["input_limit"]}\r\n`
    return message
}

const constructHeaderOptions = function (content: any): any{
    const options = {
        host: "192.168.129.105",
        port: "65432",
        method: "POST",
        headers: {
            "Content-Length": Buffer.byteLength(content)
        }
    }
    return options
}

const sendRecieve = function (sendData: any): Promise<any[]> {
    const returnDataString = JSON.stringify(sendData)
    const options = constructHeaderOptions(returnDataString)
    return new Promise((resolve, reject) => {
        const cache = []
        let timeout = undefined
        const req = request(options, res => {
            res.on("data", d => {
                let recievedData = d.toString()
                const messages = processMessage(recievedData)
                messages.forEach(item => {
                    if (item.mresolve == "print"){
                        console.log(item.mdata)
                    }
                    else if (item.mresolve == "return"){
                        cache.push(item.mdata)
                        resolve(cache)
                    }
                    else if (item.mresolve == "cache"){
                        cache.push(item.mdata)
                        if (item.getCacheTimeout()){
                            if (!timeout || timeout > item.getCacheTimeout()){
                                timeout = item.getCacheTimeout()
                            }
                        }
                    }
                })
                if (timeout){
                    setTimeout(() => {resolve(cache)}, timeout)
                }
                
            })

        })
        req.write(returnDataString)
        req.end()
    })
    
}

export { processMessage, constructHeaderOptions, sendRecieve }