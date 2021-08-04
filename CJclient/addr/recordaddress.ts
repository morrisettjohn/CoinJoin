import * as fs from "fs"
import { get_address_data } from "./getaddrdata"

const record_address = function(addr: string, username: string) {
    try {
        let data = get_address_data()
        if (username in data){
            console.log(`${username} is already a username, please use a different one`)
            return
        }


        data[username] = addr
        console.log(`recorded address ${addr} under username ${username}`)
        fs.writeFileSync('./addresses.txt', JSON.stringify(data))
    }   
    catch (err) {
        console.log("error writing to address file")
    }
}

export { record_address }