from cb58ref import cb58encode, cb58decode
from params import *
from struct import *
from bech32utils import bech32_pack_address

def convert_to_pybuffer(data, start, end):
    returndata = b""
    while start < end:
        hex_item = pack(">B", data[start])
        returndata += hex_item
        start += 1
    return returndata

def unpack_inp(inputbuf):
    start = 0
    txid = cb58encode(convert_to_pybuffer(inputbuf, start, start + TXID_BUF_LENGTH))
    start += TXID_BUF_LENGTH
    outputidx = unpack(">I", convert_to_pybuffer(inputbuf, start, start + OUTPUTIDX_BUF_LENGTH))[0]
    start += OUTPUTIDX_BUF_LENGTH
    assetid = cb58encode(convert_to_pybuffer(inputbuf, start, start + ASSETID_BUF_LENGTH))
    start += ASSETID_BUF_LENGTH
    typeid = unpack(">I", convert_to_pybuffer(inputbuf, start, start + TYPEID_BUF_LENGTH))[0]
    start += TYPEID_BUF_LENGTH
    assetamount = unpack(">Q", convert_to_pybuffer(inputbuf, start, start + ASSETAMOUNT_BUF_LENGTH))[0]
    start += ASSETAMOUNT_BUF_LENGTH
    sigcounts = unpack(">I", convert_to_pybuffer(inputbuf, start, start + SIGCOUNT_BUF_LENGTH))[0]
    return {"txid": txid, "outputidx": outputidx, "assetid": assetid, "typeid": typeid,\
            "inputamount": assetamount, "sigcounts": sigcounts}

def unpack_out(outputbuf):
    start = 0
    assetid = cb58encode(convert_to_pybuffer(outputbuf, start, start+ASSETID_BUF_LENGTH))
    start += ASSETID_BUF_LENGTH
    typeid = unpack(">I", convert_to_pybuffer(outputbuf, start, start + TYPEID_BUF_LENGTH))[0]
    start += TYPEID_BUF_LENGTH
    assetamount = unpack(">Q", convert_to_pybuffer(outputbuf, start, start + ASSETAMOUNT_BUF_LENGTH))[0]
    start += ASSETAMOUNT_BUF_LENGTH
    locktime = unpack(">Q", convert_to_pybuffer(outputbuf, start, start + LOCKTIME_BUF_LENGTH))[0]
    start += LOCKTIME_BUF_LENGTH
    threshold = unpack(">I", convert_to_pybuffer(outputbuf, start, start + THRESHOLD_BUF_LENGTH))[0]
    start += THRESHOLD_BUF_LENGTH
    numaddresses = unpack(">I", convert_to_pybuffer(outputbuf, start, start + NUMADDRESSES_BUF_LENGTH))[0]
    start += NUMADDRESSES_BUF_LENGTH
    address = convert_to_pybuffer(outputbuf, start, start+ADDRESS_BUF_LENGTH)
    print(address)
    return {"assetid": assetid, "typeid": typeid, "outputamount": assetamount,\
            "locktime": locktime, "threshold": threshold, "numaddresses": numaddresses, "address": address}

def pack_out(assetid, assetamount, locktime, threshold, addresses):
    return_buffer = []
    #Add the assetid
    assetidbuf = cb58decode(assetid)
    typeidbuf = pack(">I", OUTPUT_TYPE_ID)
    
    assetamountbuf = pack(">Q", assetamount)
    locktimebuf = pack(">Q", locktime)
    thresholdbuf = pack(">I", threshold)
    numaddressesbuf = pack(">I", len(addresses))
    addressbuf = []
    for addr in addresses:
        addressbuf.extend(bech32_pack_address(addr))
    for buf in [assetidbuf, typeidbuf, assetamountbuf, locktimebuf, thresholdbuf, numaddressesbuf, addressbuf]:
        return_buffer.extend(buf)
    return return_buffer