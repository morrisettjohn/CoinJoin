import subprocess
from subprocess import CalledProcessError
import json
from params import BNSCALE
from decimal import Decimal, getcontext

getcontext().prec = 9

class Buffer:

    def __init__(self, rawbuffer):
        self.rawbuffer = rawbuffer

    def parseBuffer(self):
        return Exception("abstract method")

class Input:

    def __init__(self, rawbuffer, networkID):
        self.rawbuffer = rawbuffer
        self.parseBuffer(networkID)

    def parseBuffer(self, networkID):
        input_data = str.encode(json.dumps({
            "inpBuf": self.rawbuffer,
            "networkID": networkID
        }))

        result = subprocess.run(['node', './js_scripts/getinputdata.js'], input = input_data, capture_output = True)
        try:
            result.check_returncode()
        except Exception:
            print(result.stderr)
            raise Exception
            

        result_data = json.loads(bytes.decode((result.stdout)))
        self.amt = Decimal(result_data["amt"])/BNSCALE
        self.assetID = result_data["assetID"]
        self.pubaddr = result_data["pubaddr"]

class Output:

    def __init__(self, rawbuffer, networkID):
        self.rawbuffer = rawbuffer
        self.parseBuffer(networkID)

    def parseBuffer(self, networkID):
        output_data = str.encode(json.dumps({
            "outBuf": self.rawbuffer,
            "networkID": networkID
        }))

        result = subprocess.run(['node', './js_scripts/getoutputdata.js'], input = output_data, capture_output = True)
        try:
            result.check_returncode()
        except Exception:
            print(result.stderr)
            raise Exception

        result_data = json.loads(bytes.decode((result.stdout)))
        self.amt = Decimal(result_data["amt"])/BNSCALE
        self.assetID = result_data["assetID"]
        self.output_addr = result_data["outputAddr"]


class Nonce(Buffer):

    def __init__(self, msg):
        self.msg = msg

    def parse_nonce(self, signed_msg = None, networkID: int = 5):
        ticket_data = str.encode(json.dumps({
            "msg": self.msg,
            "signed_msg": signed_msg,
            "networkID": networkID
        }))

        result = subprocess.run(['node', './js_scripts/getnoncedata.js'], input = ticket_data, capture_output=True)
        try:
            result.check_returncode()
        except CalledProcessError:
            print(result.stderr)
            raise Exception

        result_data = json.loads(bytes.decode((result.stdout)))
        self.nonce_addr = result_data["nonceAddr"]

    
class Sig(Buffer):
    
    def __init__(self, utx, sig, networkID):
        self.sig = sig
        self.parseBuffer(utx, networkID)

    def parseBuffer(self, utx, networkID):
        sig_data = str.encode(json.dumps({
            "utx": utx,
            "sig": self.sig,
            "networkID": networkID
        }))
        
        result = subprocess.run(['node', './js_scripts/getsigdata.js'], input = sig_data, capture_output=True)
        try:
            result.check_returncode()
        except CalledProcessError:
            print(result.stderr)
            raise Exception

        result_data = json.loads(bytes.decode((result.stdout)))
        self.sig_addr = result_data["sigAddr"]



x = Decimal("1.01")