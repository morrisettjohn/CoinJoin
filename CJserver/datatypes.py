import subprocess
from subprocess import CalledProcessError
import json
from params import BNSCALE
from decimal import Decimal, getcontext
from params import *

getcontext().prec = 9

class Input:

    def __init__(self, raw_buf, network_ID):
        self.raw_buf = raw_buf
        self.parse_buf(network_ID)

    def parse_buf(self, network_ID):
        input_data = str.encode(json.dumps({
            "inp_buf": self.raw_buf,
            "network_ID": network_ID
        }))

        result = subprocess.run(['node', './js_scripts/getinputdata.js'], input = input_data, capture_output = True)
        try:
            result.check_returncode()
        except Exception:
            print(result.stdout)
            print(result.stderr)
            raise Exception
            

        result_data = json.loads(bytes.decode((result.stdout)))
        self.amt = float(result_data["amt"])/BNSCALE
        self.asset_ID = result_data["asset_ID"]
        self.pub_addr = result_data["pub_addr"]

class Output:

    def __init__(self, raw_buf, network_ID):
        self.raw_buf = raw_buf
        self.parse_buf(network_ID)

    def parse_buf(self, network_ID):
        output_data = str.encode(json.dumps({
            "out_buf": self.raw_buf,
            "network_ID": network_ID
        }))

        result = subprocess.run(['node', './js_scripts/getoutputdata.js'], input = output_data, capture_output = True)
        try:
            result.check_returncode()
        except Exception:
            print(result.stderr)
            raise Exception

        result_data = json.loads(bytes.decode((result.stdout)))
        self.amt = float(result_data["amt"])/BNSCALE
        self.asset_ID = result_data["asset_ID"]
        self.output_addr = result_data["output_addr"]


class Nonce:

    def __init__(self, msg):
        self.msg = msg

    def parse_nonce(self, nonce: str, nonce_sig, network_ID: int = 5):
        if nonce[:NONCE_LENGTH] != self.msg:
            raise Exception("nonce does not match the one given to the user")
        
        verification_data = str.encode(json.dumps({
            "msg": nonce,
            "signed_msg": nonce_sig,
            "network_ID": network_ID
        }))

        result = subprocess.run(['node', './js_scripts/getnoncedata.js'], input = verification_data, capture_output=True)
        try:
            result.check_returncode()
        except CalledProcessError:
            print(result.stderr)
            raise Exception

        result_data = json.loads(bytes.decode((result.stdout)))
        self.nonce_addr = result_data["nonce_addr"]

    
class Sig:
    
    def __init__(self, utx, sig, network_ID):
        self.sig = sig
        self.parse_buf(utx, network_ID)

    def parse_buf(self, utx, network_ID):
        sig_data = str.encode(json.dumps({
            "utx": utx,
            "sig": self.sig,
            "network_ID": network_ID
        }))
        
        result = subprocess.run(['node', './js_scripts/getsigdata.js'], input = sig_data, capture_output=True)
        try:
            result.check_returncode()
        except CalledProcessError:
            print(result.stderr)
            raise Exception

        result_data = json.loads(bytes.decode((result.stdout)))
        self.sig_addr = result_data["sig_addr"]