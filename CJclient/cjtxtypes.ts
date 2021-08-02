import { issuetx } from "./issuestx"
import { sendsignature } from "./sendsignature"
import { sendutxodata } from "./sendutxodata"


const fullcjtx = async(joinid: number, assetid: string, inputamount: number, 
    outputamount: number, destinationaddr: string, pubaddr: string, privatekey: string, networkID: number): Promise<any> => {

    const wiretxdata = await sendutxodata(joinid, assetid, inputamount, outputamount, destinationaddr, pubaddr, privatekey, networkID)
    const wiretx = wiretxdata[0]
    const input = wiretxdata[1]
    const output = wiretxdata[2]
    pubaddr = wiretxdata[3]
    await sendsignature(joinid, wiretx, pubaddr, privatekey, networkID, input, output)

}


export { fullcjtx }