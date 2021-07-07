from bech32 import bech32_encode, bech32_decode, bech32_hrp_expand

def bech32_pack_address(address: str):
        parts = address.strip().split('-')
        parts[1]
        
        if len(parts) < 2:
            raise Exception('Error - Valid address should include -')
        if len(parts[0]) < 1:
            raise Exception('Error - Valid address must have prefix before -')
        
        split = parts[1].index('1')
        if split < 0:
            raise Exception('Error - Valid address must include separator (1)');
        humanReadablePart = parts[1][0:split]
        if len(humanReadablePart) < 1:
            raise Exception('Error - HRP should be at least 1 character')
        if humanReadablePart != 'avax' and humanReadablePart != 'fuji' and humanReadablePart != 'local':
            raise Exception('Error - Invalid HRP')
        return fromWords(bech32_decode(parts[1])[1])

def convert (data, inBits, outBits, pad):
    value = 0
    bits = 0
    maxV = (1 << outBits) - 1

    result = []
    for i in range (len(data)):
  
        value = (value << inBits) | data[i]
        bits += inBits

        while (bits >= outBits):
            bits -= outBits
            result.append((value >> bits) & maxV)

    if pad:
        if (bits > 0):
            result.push((value << (outBits - bits)) & maxV)
        
        else:
            if (bits >= inBits):
                return 'Excess padding'
            if ((value << (outBits - bits)) & maxV): 
                return 'Non-zero padding'
  
    return result

def toWords (bytes):
    res = convert(bytes, 8, 5, True)
    if isinstance(res, list):
        return res
    else:
        raise Exception(res)

def fromWords (words):
    res = convert(words, 5, 8, False)
    if isinstance(res, list):
        return res
    else:
        raise Exception(res)