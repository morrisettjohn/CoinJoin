import { sendRecieve } from "./processmessage"
import { request } from "http"

const selectjoin = async(assetid: string, assetamount: number, min_users?: number, max_users?: number): Promise<any> => {
    
    const returnData = {
        "messagetype": 1,
        "assetid": assetid,
        "assetamount": assetamount,
    }
    if (min_users){
        returnData["min_users"] = min_users
    }
    if (max_users){
        returnData["max_users"] = max_users
    }
    sendRecieve(returnData)
}

export { selectjoin }