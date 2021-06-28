import { sendutxodata } from "../sendutxodata";
import { Defaults } from "avalanche/dist/utils";

const networkID = 5
const joinid = 6
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const assetamount = 1.15

const destinationaddr1 = "X-fuji1ywknekcr6rkekg9g996dsnsdg20wmvwhpsmup6"
const pubaddr1 = "X-fuji13a3dm204mh9hfjx3ajpk33cchgszh2qry97ml9"
const privatekey1 = "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2"

const destinationaddr2 = "X-fuji1tunzyk0v8fw5ee73uzdedrtunf26936fy9wg48"
const pubaddr2 =         "X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443"
const privatekey2 = "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY"


const main = async(): Promise<any> => {
    const txdata = await sendutxodata(joinid, avaxAssetID, assetamount, destinationaddr1, pubaddr1, privatekey1)
}
main()