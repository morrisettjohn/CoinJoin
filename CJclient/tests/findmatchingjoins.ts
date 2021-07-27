import { findMatchingJoins } from "../findmatchingjoins";

//usage:  node test.js *assetid/name* *amount* *networkID* *min_users?* *max_users?*
const args = process.argv.slice(2)

let min_users = undefined
let max_users = undefined

if (args.length > 3){
    min_users = parseInt(args[3])
}

if (args.length > 4){
    max_users = parseInt(args[4])
}

const main = function() {
    findMatchingJoins(args[0], parseInt(args[1]), parseInt(args[2]), min_users, max_users)
}
main()