import { constructHeaderOptions, processMessage, sendRecieve } from "./processmessage"
import { request } from "http"

const getjoindata = async(joinid: number): Promise<any> => {
    const returnData = {
        "messagetype": 2,
        "joinid": joinid
    }
    sendRecieve(returnData)
}

export { getjoindata }