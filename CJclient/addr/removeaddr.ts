import * as fs from "fs"
import { get_address_data } from "./getaddrdata"

const remove_address = function(remove_item: string){
    try {
        let username = undefined
        let addr = undefined
        let data = get_address_data()
        if (remove_item in data){
            username = remove_item
            addr = data[username]
            delete data[remove_item]
        }
        else {
            console.log("username/private key does not exist, did not remove")
            return
        }

        console.log(`removed address ${addr} under username ${username}`)
        fs.writeFileSync('./addresses.txt', JSON.stringify(data))
    }   
    catch (err) {
        console.log("error writing to address file")
    }
}

export { remove_address }