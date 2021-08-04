import { send_recieve } from "./processmessage"
import * as consts from "./constants"

const get_option_data = async(): Promise<any> => {
    const return_data = {
        "message_type": consts.START_PROCESS
    }
    send_recieve(return_data)
}

export { get_option_data }