import { exitcj } from "../exitcj"
import { tests, wtests } from "./testaddrs";
import { getKeyType } from "../avalancheutils";

//usage:  node test.js *assetid/name* *amount* *networkID* *min_users?* *max_users?*
const args = process.argv.slice(2)



const main = function() {

    const joinid = parseInt(args[0])
    const networkID = parseInt(args[1])

    let publickey = undefined
    let privatekey = undefined

    if (args[2] in tests){
        privatekey = tests[args[2]][1]
        publickey = tests[args[2]][0]
    }

    else  if (args[2] in wtests){
            privatekey = wtests[args[2]][1]
            if (args.length < 4){
                throw new Error("not enough args")
            }
            publickey = args[3]
    }
    else {
        privatekey = args[2]
        publickey = args[3]
    }


    if (args[0] == "help"){
        console.log("usage: node exitccj.js *joinid* *networkID* *testkeypair / privatekey* *pubkey*")
    } 
    else {
        exitcj(joinid, networkID, publickey, privatekey)
    }
}
main()