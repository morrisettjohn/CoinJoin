import * as fs from "fs"

const log_info = function(message: any) {
    message = `at ${new Date().toLocaleString()}:  ${message}\n`

    fs.appendFile('log.txt', message, (err) => {
        if (err){
            console.log("error writing to log.txt")
            throw err
        }
        else {
            console.log("logged message")
        }
    })
}

export { log_info }