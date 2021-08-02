from coinjoin import JoinState
from params import *
from assetinfo import *

samples = {}
sample0 = JoinState(
    connect_limit = 7,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 1,
    feepercent = .01,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample0.id] = sample0

sample1 = JoinState(
    connect_limit = 5,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 10,
    feepercent = .10,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample1.id] = sample1

sample2 = JoinState(
    connect_limit = 6,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 100,
    feepercent = .05,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample2.id] = sample2

sample3 = JoinState(
    connect_limit = 3,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 1,
    feepercent = .50,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample3.id] = sample3

sample4 = JoinState(
    connect_limit = 9,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 10,
    feepercent = .02,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample4.id] = sample4

sample5 = JoinState(
    connect_limit = 6,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 10,
    feepercent = .15,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample5.id] = sample5

sample6 = JoinState(
    connect_limit = 3,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 1,
    feepercent = .15,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample6.id] = sample6

sample7 = JoinState(
    connect_limit = 4,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 1,
    feepercent = .10,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample7.id] = sample7

sample8 = JoinState(
    connect_limit = 1,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 1,
    feepercent = .01,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
    debug_mode = True
)
samples[sample8.id] = sample8

sample9 = JoinState(
    connect_limit = 5,
    networkID = FUJI,
    assetID = AVAX_FUJI_ID,
    assetamount = 1,
    feepercent = .01,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample9.id] = sample9

