# Defines different data types that users have provided

import subprocess
from subprocess import CalledProcessError
import json
from params import BNSCALE
from decimal import Decimal, getcontext
from params import *

getcontext().prec = 9


#Class that contains information about a user's input
class Input:

    def __init__(self, raw_buf, network_ID):
        self.raw_buf = raw_buf
        self.parse_buf(network_ID) #parses the input buffer the user provides

    #runs a subprocess that determines what kind of data the input provides
    def parse_buf(self, network_ID):
        input_data = str.encode(json.dumps({
            "inp_buf": self.raw_buf,
            "network_ID": network_ID
        }))

        result = subprocess.run(['node', './js_scripts/getinputdata.js'], input = input_data, capture_output = True)
        result.check_returncode()
        result_data = json.loads(bytes.decode((result.stdout)))
        
        #set the input information obtained from parsing the input buffer
        self.amt = float(result_data["amt"])/BNSCALE
        self.asset_ID = result_data["asset_ID"]
        self.pub_addr = result_data["pub_addr"]


#Class that contains information about a user's output
class Output:

    def __init__(self, raw_buf, network_ID):
        self.raw_buf = raw_buf
        self.parse_buf(network_ID) #parse the output buffer the user provides

    def parse_buf(self, network_ID):
        output_data = str.encode(json.dumps({
            "out_buf": self.raw_buf,
            "network_ID": network_ID
        }))

        result = subprocess.run(['node', './js_scripts/getoutputdata.js'], input = output_data, capture_output = True)
        result.check_returncode()
        result_data = json.loads(bytes.decode((result.stdout)))

        #set the output information obtained from parsing the output buffer
        self.amt = float(result_data["amt"])/BNSCALE
        self.asset_ID = result_data["asset_ID"]
        self.output_addr = result_data["output_addr"]


#Class that contains information about a user's verification nonce
class Nonce:

    def __init__(self, msg):
        self.msg = msg #stores the nonce that the server provides to the user

    #Given a nonce and signature from a user, parse the address which signed the nonce
    def parse_nonce(self, nonce: str, nonce_sig, network_ID):
        if nonce[:NONCE_LENGTH] != self.msg:
            raise Exception("nonce does not match the one given to the user")
        
        verification_data = str.encode(json.dumps({
            "msg": nonce,
            "signed_msg": nonce_sig,
            "network_ID": network_ID
        }))

        result = subprocess.run(['node', './js_scripts/getnoncedata.js'], input = verification_data, capture_output=True)
        result.check_returncode()
        result_data = json.loads(bytes.decode((result.stdout)))

        #set the address that came from the nonce and signature
        self.nonce_addr = result_data["nonce_addr"]


#Class that contains information about a user's signature
class Sig:
    
    def __init__(self, wtx, sig, network_ID):
        self.sig = sig
        self.parse_buf(wtx, network_ID) #parse the signature info

    #subprocess that determines who signed the wire transaction
    def parse_buf(self, wtx, network_ID):
        sig_data = str.encode(json.dumps({
            "wtx": wtx,
            "sig": self.sig,
            "network_ID": network_ID
        }))
        
        result = subprocess.run(['node', './js_scripts/getsigdata.js'], input = sig_data, capture_output=True)
        if (result.stderr != b''):
            print(result.stderr)
        result.check_returncode()
        result_data = json.loads(bytes.decode((result.stdout)))

        #sets the address that came from the wtx and the signature of the wtx
        self.sig_addr = result_data["sig_addr"]