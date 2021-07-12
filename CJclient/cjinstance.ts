import { mainModule } from "process"
import { issuetx } from "./issuetx"
import { sendsignature } from "./sendsignature"
import { sendutxodata } from "./sendutxodata"

const createInstance = function(data){
    if ("joinid" in data && "assetid" in data && "inputamount" in data && "outputamount" in data && "destinationaddr" in data
        && "pubaddr" in data && "privatekey" in data && "networkID" in data){
            var cjinstance = {
                joinid: data.joinid,
                assetid: data.assetid,
                inputamount: data.inputamount,
                outputamount: data.outputamount,
                destinationaddr: data.destinationaddr,
                pubaddr: data.pubaddr,
                privatekey: data.privatekey,
                networkID: data.networkID,
                input: undefined,
                output: undefined,

                sendUTXOData:async():Promise<any> => {},
                sendSignature:async(data: any):Promise<any> => {},
                issuetx:async(data: any):Promise<any> => {}
            }
        }

        cjinstance.sendUTXOData = async():Promise<any> => {
            sendutxodata(cjinstance.joinid, cjinstance.assetid, cjinstance.inputamount, 
                         cjinstance.outputamount, cjinstance.destinationaddr, cjinstance.pubaddr, 
                         cjinstance.privatekey, cjinstance.networkID)
        }

        cjinstance.sendSignature = async(data):Promise<any> => {
            sendsignature(cjinstance.joinid, data, cjinstance.pubaddr, cjinstance.privatekey,
                          cjinstance.networkID, cjinstance.input, cjinstance.output)
        }

        cjinstance.issuetx = async(data):Promise<any> => {
            issuetx(data, cjinstance.networkID)
        }

    return cjinstance
}

const main = function(){
    const instance = createInstance("x")
}
const instance = createInstance("x")
instance.sendUTXOData()

export {instance}