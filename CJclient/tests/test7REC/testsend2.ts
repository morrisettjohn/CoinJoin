import { sendutxodata } from "../../sendutxodata";
import { Defaults } from "avalanche/dist/utils";

const networkID = 5
const joinid = 7
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const assetamount = 2.2

const destinationaddr1 = "X-fuji13a3dm204mh9hfjx3ajpk33cchgszh2qry97ml9"
const pubaddr1 = "X-fuji1ywknekcr6rkekg9g996dsnsdg20wmvwhpsmup6"
const privatekey1 = "PrivateKey-ji3ENE83u1451cu8GCaL1mHYdn9tDUL2L8hJtEHsTSJNVEnbd"

const destinationaddr2 = "X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443"
const pubaddr2 = "X-fuji1tunzyk0v8fw5ee73uzdedrtunf26936fy9wg48"
const privatekey2 = "PrivateKey-24Nw3joRD8WVV4nviVTVpQcMGWX7Mg3DkYFY2NKcqDZbCRzXpC"

const destinationaddr3 = "X-fuji10a7tx3xl2cyp3g60d68zh80tzen0lwxd548u82"
const pubaddr3 = "X-fuji12jwy0ctuankcamu0qv0dcy95pxsr578ju7t7qe"
const privatekey3 = "PrivateKey-2iSH7BA88LF5mozMd2cRmkFdGHQdksMRnmQADhWPfGhNFRPiii"

const destinationaddr4 = "X-fuji1408364q97l7x6hjjqdmkjl09hjn5r3uyqwfa9l"
const pubaddr4 = "X-fuji1ga8cr9eu7fq9x6f7zvwq26xmm4vdmdg7zrveav"
const privatekey4 = "PrivateKey-28895VhkPjCeVwj8eThqMeFrCX4A44LucRbU9pSBucd1x4LnvT"


const main = async(): Promise<any> => {
    const txdata = await sendutxodata(joinid, avaxAssetID, assetamount, destinationaddr2, pubaddr2, privatekey2)
}
main()