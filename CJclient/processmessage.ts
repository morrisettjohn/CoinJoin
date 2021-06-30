import { issuetx } from "./issuetx"
import { sendsignature } from "./sendsignature"


const processMessage = function (recievedData: string, joinid?: any, pubaddr?: any, privatekey?: any) {
    while (recievedData.indexOf("\r\n\r\n") != -1){
        const endIndex: number = recievedData.indexOf("\r\n\r\n")
        const messageType: string = recievedData.slice(0, 3)
        const messageData: string = recievedData.slice(3, endIndex)
        recievedData = recievedData.slice(endIndex + 4)
    
        if (messageType == "MSG"){
            console.log(messageData)
        }
        else if (messageType == "ERR"){
            console.log("ERROR: " + messageData)
        }
        else if (messageType == "STX"){
            console.log("recieved signedtx")
            issuetx(JSON.parse(messageData))
        }
        else if (messageType == "WTX"){
            console.log("recieved wiretx")
            sendsignature(joinid, JSON.parse(messageData), pubaddr, privatekey)
        }
    }
}

export { processMessage }