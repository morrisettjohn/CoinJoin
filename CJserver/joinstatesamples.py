from joinstate import JoinState
from params import *
from assetinfo import *

samples = {}
sample0 = JoinState(
    threshold = 7,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 1,
    fee_percent = .01,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample0.ID] = sample0

sample1 = JoinState(
    threshold = 5,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 10,
    fee_percent = .10,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample1.ID] = sample1

sample2 = JoinState(
    threshold = 6,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 100,
    fee_percent = .05,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample2.ID] = sample2

sample3 = JoinState(
    threshold = 3,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 1,
    fee_percent = .50,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample3.ID] = sample3

sample4 = JoinState(
    threshold = 9,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 10,
    fee_percent = .02,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample4.ID] = sample4

sample5 = JoinState(
    threshold = 6,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 10,
    fee_percent = .15,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample5.ID] = sample5

sample6 = JoinState(
    threshold = 3,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 1,
    fee_percent = .15,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample6.ID] = sample6

sample7 = JoinState(
    threshold = 4,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 1,
    fee_percent = .10,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample7.ID] = sample7

sample8 = JoinState(
    threshold = 1,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 1,
    fee_percent = .01,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
    debug_mode = True
)
samples[sample8.ID] = sample8

sample9 = JoinState(
    threshold = 5,
    network_ID = FUJI,
    asset_ID = AVAX_FUJI_ID,
    out_amount = 1,
    fee_percent = .01,
    fee_address = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
)
samples[sample9.ID] = sample9

