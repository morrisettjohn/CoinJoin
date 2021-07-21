import { sendRecieve } from "./processmessage"
import * as consts from "./constants"

const getoptiondata = async(): Promise<any> => {
    const returnData = {
        "messagetype": consts.START_PROCESS
    }
    sendRecieve(returnData)
}

export { getoptiondata }