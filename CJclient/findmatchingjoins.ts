//return the joins from the server that match the specificatoins put in

import { send_recieve } from "./processmessage"
import * as consts from "./constants"

const find_matching_joins = async(asset_ID: string, asset_amount: number, network_ID: number, ip: string, 
    min_users?: number, max_users?: number): Promise<any> => {
    
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
    const join_list = (await send_recieve(return_data, ip))[0]
    return join_list
}

export { find_matching_joins }