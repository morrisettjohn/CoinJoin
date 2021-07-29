from subprocess import *


AVAX_FUJI_ID = "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK"
AVAX_FUJI_DENOMS = [1, 10, 100]
AVAX_FUJI_NAME = "Avax-test"
AVAX_FUJI_NETWORKID = 5
AVAX_FUJI = (AVAX_FUJI_NAME, AVAX_FUJI_ID, AVAX_FUJI_DENOMS, AVAX_FUJI_NETWORKID)

AVAX_MAINNET_ID = "FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z"
AVAX_MAINNET_DENOMS = [1, 10, 100]
AVAX_MAINNET_NAME = "Avax-main"
AVAX_MAINNET_NETWORKID = 1
AVAX_MAINNET = (AVAX_MAINNET_NAME, AVAX_MAINNET_ID, AVAX_MAINNET_DENOMS, AVAX_MAINNET_NETWORKID)

ETHER_ID = "2"
ETHER_DENOMS = [1, 5, 20]
ETHER_NAME = "Etherium"
ETHER_NETWORKID = 1
ETHER = (ETHER_NAME, ETHER_ID, ETHER_DENOMS, ETHER_NETWORKID)

ASSET_TYPES = [AVAX_FUJI, AVAX_MAINNET, ETHER]
ASSET_NAMES, ASSET_IDS, ASSET_DENOMS, dummy = map(list, zip(*ASSET_TYPES))

#if the asset is an asset name, as opposed to an id, convert to the proper assetid
def convert_to_asset_id(asset):
    testint = ASSET_NAMES.index(asset)
    if testint != -1:
        asset = ASSET_IDS[testint]
    return asset

def convert_to_asset_name(asset):
    testint = ASSET_IDS.index(asset)
    if testint != -1:
        asset = ASSET_NAMES[testint]
    return asset