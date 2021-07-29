import { sendRecieve } from "./processmessage";
import * as consts from "./constants"
import { requestNonce } from "./requestjoin";
import { generatekeychain, generatexchain, getKeyType } from "./avalancheutils";

const exitcj = async(joinid: number, networkID: number, pubaddr: string, privatekey: string): Promise<any> => {

    const keyType = getKeyType(privatekey)
    console.log(networkID)

    const ticket = await requestNonce(joinid, pubaddr, privatekey, networkID)
    const sendData = {
        "joinid": joinid,
        "messagetype": consts.EXIT,
        "pubaddr": pubaddr,
        "ticket": ticket,
    }

    console.log("sending data to coinjoin server now")
    await sendRecieve(sendData)
}

export { exitcj }