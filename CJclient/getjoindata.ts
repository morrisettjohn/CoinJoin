import { sendRecieve } from "./processmessage"
import * as consts from "./constants"

const getjoindata = async(joinid: number): Promise<any> => {
    const returnData = {
        
        "messagetype": consts.GET_JOIN_DATA,
        "joinid": joinid
    }
    sendRecieve(returnData)
}

export { getjoindata }