import { constructHeaderOptions, processMessage, sendRecieve } from "./processmessage"
import { request } from "http"

const getoptiondata = async(): Promise<any> => {
    const returnData = {
        "messagetype": 0
    }
    sendRecieve(returnData)
}

export { getoptiondata }