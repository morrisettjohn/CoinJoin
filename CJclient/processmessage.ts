import { issuetx } from "./issuetx"
import { sendsignature } from "./sendsignature"
import { TESTHOST, TESTPORT } from "./params"
import { request } from "http"
import { join } from "path"

//takes a message from the coinjoin server and processes it, using a 3 character prefix as a messagetype
const processMessage = function (recievedData: string, joinid?: any, pubaddr?: any, privatekey?: any,
    input?: any, output?: any): any{
    while (recievedData.indexOf("\r\n\r\n") != -1){
        const endIndex: number = recievedData.indexOf("\r\n\r\n")
        const messageType: string = recievedData.slice(0, 3)
        const messageData: string = recievedData.slice(3, endIndex)
        recievedData = recievedData.slice(endIndex + 4)
        //handling message
        if (messageType == "MSG"){
            console.log(messageData)
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
        //handling send_utxo data
        else if (messageType == "WTX"){
            console.log("recieved wiretx")
            sendsignature(joinid, JSON.parse(messageData), pubaddr, privatekey, input, output)
        }
        //handling signed_tx data
        else if (messageType == "STX"){
            console.log("recieved signedtx")
            issuetx(JSON.parse(messageData))
        }
        else {
            console.log("not a valid messagetype")
        }
    }
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

const sendRecieve = function (sendData: any, joinid?: any, pubaddr?: any, privatekey?: any,
    input?: any, output?: any) {
    const returnDataString = JSON.stringify(sendData)
    const options = constructHeaderOptions(returnDataString)

    const req = request(options, res => {
        res.on("data", d => {
            let recievedData = d.toString()
            processMessage(recievedData, joinid, pubaddr, privatekey, input, output)
        })
    })
    req.write(returnDataString)
    req.end()
    
}

export { processMessage, constructHeaderOptions, sendRecieve }