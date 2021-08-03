import { issuetx } from "./issuestx"
import { sendsignature } from "./sendsignature"
import { sendutxodata } from "./sendutxodata"


const fullcjtx = async(joinid: number, destinationaddr: string, privatekey: string, inputamount: number, assetid: string,  
    outputamount: number,  networkID: number): Promise<any> => {

    const join_params = get_join_params

    const wiretxdata = await sendutxodata(joinid, assetid, inputamount, outputamount, destinationaddr, privatekey, networkID)
    const wiretx = wiretxdata[0]
    const input = wiretxdata[1]
    const output = wiretxdata[2]
    const pubaddr = wiretxdata[3]
    await sendsignature(joinid, wiretx, pubaddr, privatekey, networkID, input, output)

}


export { fullcjtx }