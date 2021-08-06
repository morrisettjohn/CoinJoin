import { send_recieve } from "./processmessage"
import * as consts from "./constants"
import { join_data_readable } from "./utils"

const get_user_list = async(join_ID: number): Promise<any> => {
    const returnData = {
        "message_type": consts.GET_JOIN_DATA,
        "join_ID": join_ID
    }
    
    const join_data = (await send_recieve(returnData))[0]
    return join_data
}

export { get_user_list }