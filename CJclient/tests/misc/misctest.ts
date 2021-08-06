import * as fs from "fs"
import { generate_nonce } from "../../generatenonce"

const log_info = function(message: any) {


}

const n = function() {
    let z = []
    for (let i = 0; i < 1000; i++){
        z.push(generate_nonce(3))
    }
    console.log(z.toString())
}

n()