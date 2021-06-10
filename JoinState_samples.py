from CoinJoin import JoinState

sample0 = JoinState(
    id = 0,
    connect_limit = 7,
    assettype = 1,
    assetamount = 1,
    feepercent = .01
)

sample1 = JoinState(
    id = 1,
    connect_limit = 5,
    assettype = 1,
    assetamount = 10,
    feepercent = .10
)

sample2 = JoinState(
    id = 2,
    connect_limit = 6,
    assettype = 1,
    assetamount = 100,
    feepercent = .05
)

sample3 = JoinState(
    id = 3,
    connect_limit = 3,
    assettype = 1,
    assetamount = 1,
    feepercent = .50
)

sample4 = JoinState(
    id = 4,
    connect_limit = 9,
    assettype = 1,
    assetamount = 10,
    feepercent = .02
)

sample5 = JoinState(
    id = 5,
    connect_limit = 6,
    assettype = 1,
    assetamount = 10,
    feepercent = .15
)

samples = {0: sample0, 1: sample1, 2: sample2, 3: sample3, 4: sample4, 5: sample5}