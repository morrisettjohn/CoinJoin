import * as fs from "fs"

const log_info = function(message: any) {
    let data = undefined
    try {
        data = fs.readFileSync('dmclean.txt', 'utf8')
        console.log(data == "")
    }   
    catch (err) {
        console.log(err)
    }

    fs.writeFile('nuts.txt', message, (err) => {
        if (err){
            console.log("error writing to log.txt")
            throw err
        }
        else {
            console.log("logged message")
        }
    })
}


log_info(JSON.stringify({"1": 1, "2": 2}))