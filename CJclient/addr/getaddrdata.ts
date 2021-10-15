import * as fs from "fs"

const get_address_data = function() {
    try {
        const data = JSON.parse(fs.readFileSync('./addresses.txt', 'utf8'))
        if (data == "") {
            return {}
        }
        return data
    }   
    catch (err) {
        return {}
    }
}

export { get_address_data }