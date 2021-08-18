
import * as fs from "fs"


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


const v = function() {
    const p = {}
    p["1"]["2"] = 3
    console.log(p)
    
}

const l = function() {
    console.log("hi_joHn".toLocaleLowerCase())
}

l()