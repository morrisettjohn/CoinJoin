import { send_recieve } from "./processmessage"
import * as consts from "./constants"
import { join_data_readable } from "./utils"

const find_matching_joins = async(asset_ID: string, asset_amount: number, network_ID: number, min_users?: number, max_users?: number): Promise<any> => {
    
    const return_data = {
        "message_type": consts.SELECT_OPTIONS,
        "asset_ID": asset_ID,
        "asset_amount": asset_amount,
        "network_ID": network_ID
    }
    
    if (min_users){
        return_data["min_users"] = min_users
    }
    if (max_users){
        return_data["max_users"] = max_users
    }
    const join_list = (await send_recieve(return_data))[0]
    console.log(join_list)
    console.log("hi")
    return join_list
}

export { find_matching_joins }