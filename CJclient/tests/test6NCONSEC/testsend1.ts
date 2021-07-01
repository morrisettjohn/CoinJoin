import { sendutxodata } from "../../sendutxodata";
import { Defaults } from "avalanche/dist/utils";

const networkID = 5
const joinid = 6
const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID
const inputamount = 1.15
const outputamount = 1



const destinationaddr1 = "X-fuji1ywknekcr6rkekg9g996dsnsdg20wmvwhpsmup6"
const pubaddr1 = "X-fuji13a3dm204mh9hfjx3ajpk33cchgszh2qry97ml9"
const privatekey1 = "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2"
const info1 = [destinationaddr1, pubaddr1, privatekey1]

const destinationaddr2 = "X-fuji1tunzyk0v8fw5ee73uzdedrtunf26936fy9wg48"
const pubaddr2 =         "X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443"
const privatekey2 = "PrivateKey-2t6UmFMctYnZXMY1BFYF41k97ZAtcedN1U9GiQiGQzmzU21oBY"
const info2 = [destinationaddr2, pubaddr2, privatekey2]

const destinationaddr3 = "X-fuji12jwy0ctuankcamu0qv0dcy95pxsr578ju7t7qe"
const pubaddr3 = "X-fuji10a7tx3xl2cyp3g60d68zh80tzen0lwxd548u82"
const privatekey3 = "PrivateKey-7f84zwffkNTAjKu1DDDrRBafWq2wE3GxZ3t7EYVFR8fTpJArc"
const info3 = [destinationaddr3, pubaddr3, privatekey3]
const info = [info1, info2, info3]

const main = async(): Promise<any> => {
    sendutxodata(joinid, avaxAssetID, inputamount, outputamount, info[0][0], info[0][1], info[0][2])
}

main()