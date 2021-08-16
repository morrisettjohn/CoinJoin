
import * as fs from "fs"
import { get_all_logs, get_server_join_txs, get_join_tx_data } from "../../addlog"

const n = async() => {
    const b = new Date()
    setTimeout(function(){
        const v = new Date()
        v.setTime(b.getTime())
        console.log(v)
        console.log(b)
    }, 1000)

}

const b = async() => {
    const data = fs.readFileSync("./test.json", "utf8")
    console.log(JSON.parse(data))
}

const c = async() => {
    const v = {"hi": 1, "bi": 2, "tri": 3}
    for (let key in v) {
        console.log(key)
    }
}

const a = async() => {
    const z = get_all_logs()
    console.log(z)
    console.log(get_server_join_txs(z, "X-fuji13gpgdlfsz6nysrjh4trhuf2hj240aguah8rxwq"))
    console.log(get_join_tx_data(z, "X-fuji13gpgdlfsz6nysrjh4trhuf2hj240aguah8rxwq", "1628879411470"))
    
}

const v = function() {
    const p = {}
    p["1"]["2"] = 3
    console.log(p)
    
}

a()