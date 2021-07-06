from CoinJoin import JoinState
from params import *
from AssetInfo import *

sample0 = JoinState(
    id = 0,
    connect_limit = 7,
    assetid = AVAX_ID,
    assetamount = 1,
    feepercent = .01
)

sample1 = JoinState(
    id = 1,
    connect_limit = 5,
    assetid = AVAX_ID,
    assetamount = 10,
    feepercent = .10
)

sample2 = JoinState(
    id = 2,
    connect_limit = 6,
    assetid = AVAX_ID,
    assetamount = 100,
    feepercent = .05
)

sample3 = JoinState(
    id = 3,
    connect_limit = 3,
    assetid = AVAX_ID,
    assetamount = 1,
    feepercent = .50
)

sample4 = JoinState(
    id = 4,
    connect_limit = 9,
    assetid = AVAX_ID,
    assetamount = 10,
    feepercent = .02
)

sample5 = JoinState(
    id = 5,
    connect_limit = 6,
    assetid = AVAX_ID,
    assetamount = 10,
    feepercent = .15
)

sample6 = JoinState(
    id = 6,
    connect_limit = 3,
    assetid = AVAX_ID,
    assetamount = 1,
    feepercent = .15,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee"
)

sample7 = JoinState(
    id = 7,
    connect_limit = 4,
    assetid = AVAX_ID,
    assetamount = 1,
    feepercent = .10,
    feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee"
)


samples = {0: sample0, 1: sample1, 2: sample2, 3: sample3, 4: sample4, 5: sample5, 6: sample6, 7: sample7}