import { getjoindata } from "../getjoindata";

//usage:  node test.js *assetid/name* *amount* *min_users?* *max_users?*
const args = process.argv.slice(2)

const main = function() {
    getjoindata(parseInt(args[0]))
}
main()