import { sendsignature } from "../sendsignature"

const joinid = 6
const recievedData = {'inputs': [{'assetid': 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK', 'amount': 1.15, 'transactionid': 'iWrSZ7ZiUqKHn6oLnh1xpA4sM1FSn4q6NsHQpz6FRCi8kdPYY', 'transactionoffset': 0, 'pubaddr': 'X-fuji1d6fetyekv4ec5enm9ltuxrd6n70ng04rpxq443'}, {'assetid': 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK', 'amount': 1.15, 'transactionid': 'nUEYax6A6HueAobCXYouukgrULCNYmdCwW5fBMKuFBuctsMbu', 'transactionoffset': 0, 'pubaddr': 'X-fuji13a3dm204mh9hfjx3ajpk33cchgszh2qry97ml9'}], 'outputs': [{'assetid': 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK', 'amount': 0.2999999999999998, 'destinationaddr': 'X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee'}, {'assetid': 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK', 'amount': 1, 'destinationaddr': 'X-fuji1tunzyk0v8fw5ee73uzdedrtunf26936fy9wg48'}, {'assetid': 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK', 'amount': 1, 'destinationaddr': 'X-fuji1ywknekcr6rkekg9g996dsnsdg20wmvwhpsmup6'}]}
const pubaddr1 = "X-fuji13a3dm204mh9hfjx3ajpk33cchgszh2qry97ml9"
const privatekey1 = "PrivateKey-ryjZWerx1vRgQnFrLJ9oxBYUS7TdMRNrBLmSAAP78L4xixvT2"

sendsignature(joinid, recievedData, pubaddr1, privatekey1)