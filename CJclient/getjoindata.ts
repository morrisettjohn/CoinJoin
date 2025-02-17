//return the information from a specific join from a cj server

import { send_recieve } from "./processmessage"
import * as consts from "./constants"

const get_join_data = async(join_ID: number, ip: string): Promise<any> => {
    const return_data = {
        
        "message_type": consts.GET_JOIN_DATA,
        "join_ID": join_ID
    }

    const join_data = (await send_recieve(return_data, ip))[0]
    return join_data
}

export { get_join_data }