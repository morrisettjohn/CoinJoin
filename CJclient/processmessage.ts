import { issuetx } from "./issuetx"
import { sendsignature } from "./sendsignature"

//takes a message from the coinjoin server and processes it, using a 3 character prefix as a messagetype
const processMessage = function (recievedData: string, joinid?: any, pubaddr?: any, privatekey?: any): any {
    while (recievedData.indexOf("\r\n\r\n") != -1){
        const endIndex: number = recievedData.indexOf("\r\n\r\n")
        const messageType: string = recievedData.slice(0, 3)
        const messageData: string = recievedData.slice(3, endIndex)
        recievedData = recievedData.slice(endIndex + 4)
    
        if (messageType == "MSG"){
            console.log(messageData)
            return undefined
        }
        else if (messageType == "ERR"){
            console.log("ERROR: " + messageData)
            return undefined
        }
        else if (messageType == "STX"){
            console.log("recieved signedtx")
            issuetx(JSON.parse(messageData))
            return undefined
        }
        else if (messageType == "WTX"){
            console.log("recieved wiretx")
            sendsignature(joinid, JSON.parse(messageData), pubaddr, privatekey)
            return undefined
        }
    }
}

export { processMessage }