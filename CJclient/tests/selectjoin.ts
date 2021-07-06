import { selectjoin } from "../selectjoin";

//usage:  node test.js *assetid/name* *amount* *min_users?* *max_users?*
const args = process.argv.slice(2)

const main = function() {
    selectjoin(args[0], parseInt(args[1]), parseInt(args[2]), parseInt(args[3]))
}
main()