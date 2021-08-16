import { send_recieve } from "./processmessage"
import * as consts from "./constants"

const get_option_data = async(ip: string): Promise<any> => {
    const return_data = {
        "message_type": consts.START_PROCESS
    }
    send_recieve(return_data, ip)
}

export { get_option_data }