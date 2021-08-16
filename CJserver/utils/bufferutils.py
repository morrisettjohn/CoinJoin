from params import *
from struct import *

def convert_to_pybuffer(data, start, end):
    returndata = b""
    while start < end:
        hex_item = pack(">B", data[start])
        returndata += hex_item
        start += 1
    return returndata

def convert_to_jsbuffer(data: bytes):
    bufferdata = []
    bufferdata.extend(data)
    return {"type": "Buffer", "data": bufferdata}

