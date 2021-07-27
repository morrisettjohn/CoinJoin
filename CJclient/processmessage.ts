import { request } from "http"

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
const processMessage = function (recievedData: string): any{
    console.log("one")
    while (recievedData.indexOf("\r\n\r\n") != -1){
        const endIndex: number = recievedData.indexOf("\r\n\r\n")
        const messageType: string = recievedData.slice(0, 3)
        const messageData: string = recievedData.slice(3, endIndex)
        recievedData = recievedData.slice(endIndex + 4)
        console.log(messageType)
        //handling message
        if (messageType == "MSG"){
            console.log("SERVER MESSAGE: " + messageData)
        }           
        //handling error message
        else if (messageType == "ERR"){
            console.log("ERROR: " + messageData)
        }
        //handling get_options data
        else if (messageType == "OPT"){
            console.log("recieved optiondata")
            console.log(JSON.parse(messageData))
        }
        //handling get_joinlist data
        else if (messageType == "JLS"){
            console.log("recieved list of compatible joins\r\n")
            const joinlist = JSON.parse(messageData)
            for (let i = 0; i < joinlist.length; i++){
                const join = joinlist[i]
                printReadableJoinData(join)
            }
        }
        else if (messageType == "JDT"){
            console.log("recieved join data\r\n")
            printReadableJoinData(JSON.parse(messageData))
        }
        else if (messageType == "NCE"){
            console.log("recieved nonce")
            return messageData
        }
        //handling send_utxo data
        else if (messageType == "WTX"){
            console.log("recieved wiretx")
            const data = JSON.parse(messageData)
            
            if (isValidWTXData(data)){
                return data
            }
            else {
                return new Error("Incomplete wtx")
            }
        }
        //handling signed_tx data
        else if (messageType == "STX"){
            console.log("recieved full tx")
            const data = JSON.parse(messageData)
            if (isValidSTX(data)){
                return data
            }
            else {
                return new Error("incomplete stx")
            }
            
        }
        else if (messageType == "TXD"){
            console.log("recieved transaction id")
            return messageData
        }
        else {
            console.log("not a valid messagetype")
        }
    }
    return undefined
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

const printReadableJoinData = function(join: any) {
    let state = "Inputs"
    if (join["state"] == 4){
        state = "Signatures"
    }
    console.log(`Join ID: ${join["id"]}`)
    console.log(`\tState: Collect ${state}`)
    console.log(`\tTotal amount (with fees): ${join["total_amount"]}`)
    console.log(`\tBase amount: ${join["base_amount"]}`)
    console.log(`\tTotal ${state} collected:  ${join["current_input_count"]}/${join["input_limit"]}\r\n`)
}

const sendRecieve = function (sendData: any): Promise<any> {
    const returnDataString = JSON.stringify(sendData)
    const options = constructHeaderOptions(returnDataString)
    return new Promise((resolve, reject) => {
        const req = request(options, res => {
            res.on("data", d => {
                let recievedData = d.toString()
                const data = processMessage(recievedData)
                if (data != undefined){
                    resolve(data)
                }
            })
        })
        req.write(returnDataString)
        req.end()
    })
    
}

export { processMessage, constructHeaderOptions, sendRecieve }