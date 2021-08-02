import { sendRecieve } from "./processmessage"
import * as consts from "./constants"

const findMatchingJoins = async(assetID: string, assetamount: number, networkID: number, min_users?: number, max_users?: number): Promise<any> => {
    
    const returnData = {
        "messagetype": consts.SELECT_OPTIONS,
        "assetID": assetID,
        "assetamount": assetamount,
        "networkID": networkID
    }
    
    if (min_users){
        returnData["min_users"] = min_users
    }
    if (max_users){
        returnData["max_users"] = max_users
    }
    sendRecieve(returnData)
}

export { findMatchingJoins }