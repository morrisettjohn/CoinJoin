from assetinfo import AVAX_FUJI_ID
import json
import subprocess
import time
import string

from assetinfo import *
from messages import send_errmessage, send_message, send_signedtx, send_wiretx, send_accepted_txid, send_nonce
from utils.httprequest import *
from params import *
from decimal import Decimal, getcontext
from struct import *
from utils.bufferutils import convert_to_jsbuffer, pack_out, unpack_inp, unpack_out
from random import choice
from subprocess import *

getcontext().prec = 9

#This is a class which holds all the data for a coinjoin.  The CoinJoin has two main states that it can be in:  collecting utxo inputs and collecting
#signatures.  

class JoinState:
    current_id = 0

    def __init__(self, connect_limit:int = DEFAULT_LOWER_USER_BOUND, assetid:str = AVAX_FUJI_ID, assetamount = 1, 
            feeaddress:str = "", feepercent = 0.10, networkID = FUJI, debug_mode: bool = False):

        
        self.id = JoinState.current_id
        self.connect_limit = connect_limit
        self.assetid = assetid
        self.assetamount = assetamount
        self.feepercent = feepercent
        self.totalamount = assetamount + assetamount * feepercent
        self.feeaddress = feeaddress
        self.state = COLLECT_INPUTS
        self.networkID = networkID
        self.last_accessed = time.time()
        self.utx = None
        self.stx = None
        self.stx_id = None
        self.pubaddresses = []
        self.pending_users = []
        self.IP_addresses = []
        self.connections = []
        self.sigs = []
        self.inputs = []
        self.outputs = []
        self.blacklist = []
        self.debug_mode = debug_mode

        if not self.isvalid_join():
            raise Exception("bad parameters")

        JoinState.current_id += 1

    #Returns the number of connections that have joined during the input stage
    def get_current_input_count(self):
        return len(self.inputs)

    #Returns the number of signatures that have joined during the signature stage
    def get_current_signature_count(self):
        count = 0
        for item in self.sigs:
            if item != [None, None]:
                count += 1
        return count

    #function that returns the current status of the join in json form, for easy access
    def get_status(self):
        status = {       
            "id": self.id,
            "state": self.state,
            "input_limit": self.connect_limit,
            "base_amount": self.assetamount,
            "fee_percent":  self.feepercent,
            "total_amount": self.totalamount,
            "last_accessed": self.last_accessed
            }
        if self.state == COLLECT_INPUTS:
            status["current_input_count"] = self.get_current_input_count()
        elif self.state == COLLECT_SIGS:
            status["current_input_count"] = self.get_current_signature_count(),
        else:
            Exception("bad")
        return status

    #returns the value of the fee after burning the minimum avax amount
    def get_fee_after_burn(self):
        return float(self.get_collected_fee_amt() - Decimal(STANDARD_BURN_AMOUNT))

    def get_all_inputs(self):
        inputs, pubaddresses, amounts = map(list, zip(*self.inputs))
        return inputs

    def get_all_input_addrs(self):
        inputs, pubaddresses, amounts = map(list, zip(*self.inputs))
        return pubaddresses

    def get_all_input_amounts(self):
        inputs, pubaddresses, amounts = map(list, zip(*self.inputs))
        return amounts

    def get_input_index(self, pubaddr):
        return self.get_all_input_addrs().index(pubaddr)

    def get_input(self, pubaddr):
        return self.inputs[self.get_input_index(pubaddr)]

    def remove_input(self, pubaddr):
        return self.inputs.pop(self.get_input_index(pubaddr))

    #returns only the output data, not the ip addresses, from the output list
    def get_all_outputs(self):
        outputs, pubaddresses, amounts = map(list, zip(*self.outputs))
        return outputs

    def get_all_output_addrs(self):
        outputs, pubaddresses, amounts = map(list, zip(*self.outputs))
        return pubaddresses

    def get_all_output_amounts(self):
        outputs, pubaddresses, amounts = map(list, zip(*self.outputs))
        return amounts

    def get_output_index(self, pubaddr):
        return self.get_all_output_addrs().index(pubaddr)

    def get_output(self, pubaddr):
        return self.outputs[self.get_output_index(pubaddr)]

    def remove_output(self, pubaddr):
        return self.outputs.pop(self.get_output_index(pubaddr))

    #returns only the signatures from the signature list, not the public addresses associated with them
    def get_all_sigs(self):
        signatures, pubaddresses = map(list, zip(*self.sigs))
        return signatures

    #returns only the addresses, not the signatures, from the signature slist
    def get_all_signer_addrs(self):
        signatures, pubaddresses = map(list, zip (*self.sigs))
        return pubaddresses

    def get_sig_index(self, pubaddr):
        return self.get_all_signer_addrs().index(pubaddr)

    def get_sig(self, pubaddr):
        return self.sigs[self.get_sig_index(pubaddr)]

    def remove_sig(self, pubaddr):
        return self.sigs.pop(self.get_sig_index(pubaddr))

    def get_all_pending_user_addr(self):
        pubaddresses, nonces = map(list, zip (*self.pending_users))
        return pubaddresses

    def get_all_pending_user_nonces(self):
        pubaddresses, nonces = map(list, zip (self.pending_users))
        return nonces

    def get_pending_user_index(self, pubaddr):
        return self.get_all_pending_user_addr().index(pubaddr)

    def get_pending_user(self, pubaddr):
        return self.pending_users[self.get_pending_user_index(pubaddr)]

    #given a public address, returns the nonce associated with it
    def get_pending_user_nonce(self, pubaddr):
        return self.get_pending_user(pubaddr)[1]

    def remove_from_pending(self, pubaddr):
        pubaddresses = self.get_all_pending_user_addr()
        self.pending_users.pop(pubaddresses.index(pubaddr))

    def get_collected_fee_amt(self):
        return sum(self.get_all_input_amounts()) - sum(self.get_all_output_amounts())

    #resets the join back to its base state
    def reset_join(self):
        self.state = COLLECT_INPUTS
        self.last_accessed = time.time()
        self.utx = None
        self.stx = None
        self.stx_id = None
        self.pubaddresses = []
        self.pending_users = []
        self.IP_addresses = []
        self.connections = []
        self.sigs = []
        self.inputs = []
        self.outputs = []
        self.blacklist = []

    #updates when the join was last accessed
    def update_last_accessed(self):
        self.last_accessed = time.time()

    #error checking when creating joins, check if parameters are valid
    def isvalid_join(self):
        if type(self.id) != int:
            return False
        if not self.debug_mode and (self.connect_limit < MIN_USER_BOUND or self.connect_limit > MAX_USER_BOUND):
            return False
        if self.assetamount <= 0:
            return False
        if self.feepercent < 0 or self.feepercent >= 1:
            return False
        return True

    #Creates a new input, and then sorts the entire list
    def inputs_append(self, inputbuf, pubaddr, amount):  
        input = self.create_input(inputbuf, pubaddr, amount)
        self.inputs.append(input)
        self.sort_inputs()

    #Creates a new output, then sorts the entire list
    def outputs_append(self, outputbuf, pubaddr, amount):
        output = self.create_output(outputbuf, pubaddr, amount)
        self.outputs.append(output)
        self.sort_outputs()

    def create_input(self, inputbuf, pubaddr, amount):
        return [inputbuf, pubaddr, Decimal(amount)]

    def create_output(self, outputbuf, pubaddr, amount):
        return [outputbuf, pubaddr, Decimal(amount)]
        
    #Convert utxo hash to binary, and then sort based on said hash
    def sort_inputs(self):
        self.inputs = sorted(self.inputs, key=lambda x:x[0]["data"])
        
    #Sort outputs based on destination address
    def sort_outputs(self):
        self.outputs = sorted(self.outputs, key=lambda x: x[0]["data"])
        
    #Add a new signature to the list.  Signatures should be in the same order as inputs, so they are ordered as such.
    def sigs_append(self, signature, pubaddr):
        index = self.get_input_index(pubaddr)  #Determines where the ip is in the list
        self.sigs[index] = [signature, pubaddr]  #Based on the index of the ip established before, assigns the none object to be an index
        
    #Initializes the signer data, by creating a list full of None objects, so that signatures can be appended in the correct order
    def initialize_sigs(self):
        for i in range(len(self.inputs)):
            self.sigs.append([None, None])

    #extracts inputs from request data
    def extract_inputbuf(request_data):
        return request_data["inputbuf"]

    #extracts outputs from request data
    def extract_outputbuf(request_data):
        return request_data["outputbuf"]

    #extracts the public address from request data
    def extract_pubaddr(request_data):
        return request_data["pubaddr"]

    def remove_pubaddr(self, pubaddr):
        self.pubaddresses.remove(pubaddr)

    #calls a subprocess that verifies if the provided ticket belongs to the provided public address
    def verify_ticket(self, pubaddr: string, ticket: string, nonce: string):
        ticket_data = str.encode(json.dumps({
            "pubaddr": pubaddr,
            "ticket": ticket,
            "nonce": nonce,
            "networkID": self.networkID
        }))

        result = subprocess.run(['node', './js_scripts/verifyticket.js'], input = ticket_data, capture_output=True)
        try:
            result.check_returncode()
        except CalledProcessError:
            print(result.stderr)
            return False
        ticket_val = bytes.decode(result.stdout)
        if ticket_val == "true":
            return True
        return False

    #calls a subprocess that verifies if the provided signature matches the signature and the unsigned transaction
    def verify_sig(self, pubaddr, signature):
        sig_data = str.encode(json.dumps({
            "pubaddr": pubaddr,
            "sig": signature,
            "utx": self.utx,
            "networkID": self.networkID
        }))
        
        result = subprocess.run(['node', './js_scripts/verifysig.js'], input = sig_data, capture_output=True)
        try:
            result.check_returncode()
        except CalledProcessError:
            print(result.stderr)
            return False
        sig_val = bytes.decode(result.stdout)
        if sig_val == "true":
            return True
        return False
    
    #calls a subprocess that returns the raw buffer data for an unsigned transaction
    def craft_utx(self):
        fee_data = {
            "assetid": self.assetid, 
            "amount": int(self.get_fee_after_burn()*BNSCALE), 
            "address": self.feeaddress
        }

        wiretx_data = str.encode(json.dumps({
            "inputs": self.get_all_inputs(),
            "outputs": self.get_all_outputs(),
            "networkID": self.networkID,
            "feedata": fee_data
        }))

        result = subprocess.run(['node', './js_scripts/craftunsignedtx.js'], input = wiretx_data, capture_output=True)

        try:
            result.check_returncode()
        except Exception:
            print(result.stderr)
            raise Exception("bad transaction data")
        
        unsignedTxBuf = convert_to_jsbuffer(result.stdout)
        return unsignedTxBuf

    #calls a subprocess that returns the raw buffer data for a signed transaction
    def craft_stx(self):
        stx_data = str.encode(json.dumps({
            "signatures": self.get_all_sigs(),
            "utx": self.utx,
        }))

        result = subprocess.run(['node', './js_scripts/craftsignedtx.js'], input = stx_data, capture_output=True)
        try:
            result.check_returncode()
        except Exception:
            print(result.stdout)
            print(result.stderr)
            raise Exception("bad stx data")
        
        signedTxBuf = convert_to_jsbuffer(result.stdout)
        return signedTxBuf

    #calls a subprocess that issues the data
    def issue_stx(self):
        issue_data = str.encode(json.dumps({
            "stx": self.stx,
            "networkID": self.networkID
        }))

        result = subprocess.run(['node', './js_scripts/issuestx.js'], input = issue_data, capture_output=True)
        try:
            result.check_returncode()
        except Exception:
            print(result.stderr)
            raise Exception("something went wrong")
        result_data = json.loads(bytes.decode((result.stdout)))
        return result_data

    #calls a subprocess that gets all of the data for a given input object
    def get_input_data(self, input_buf):
        input_data = str.encode(json.dumps({
            "inpBuf": input_buf,
        }))

        result = subprocess.run(['node', './js_scripts/getinputdata.js'], input = input_data, capture_output = True)
        try:
            result.check_returncode()
        except CalledProcessError:
            print(result.stderr)
            return None
        result_data = json.loads(bytes.decode((result.stdout)))
        return result_data

    #calls a subprocess that gets all of the data for a given output object
    def get_output_data(self, output_buf):
        output_data = str.encode(json.dumps({
            "outBuf": output_buf,
            "networkID": self.networkID
        }))

        result = subprocess.run(['node', './js_scripts/getoutputdata.js'], input = output_data, capture_output = True)
        try:
            result.check_returncode()
        except CalledProcessError:
            print(result.stderr)
            return None
        result_data = json.loads(bytes.decode((result.stdout)))
        return result_data

    #determines if the given public address has request a nonce from the cj
    def in_pending_users(self, pubaddr):
        if self.pending_users == []:
            return False
        if self.get_pending_user_index(pubaddr) == -1:
            return False
        return True
    
    #closes all connections associated with the cj
    def close_all_connections(self):
        for item in self.connections:
            item.close()
        self.connections = []

    #sends a message to all connections
    def send_message_to_all(self, message):
        for item in self.connections:
            send_message(item, message)

    #sends an error messsage to all connections
    def send_errmessage_to_all(self, message):
        for item in self.connections:
            send_errmessage(item, message)

    #sets the cj to a fresh collect sigs state
    def set_to_collect_sigs(self):
        self.stx = None
        self.stx_id = None
        self.sigs = None
        self.state = COLLECT_SIGS

    def is_valid_input(self, input_data):
        inputamount = int(input_data["amt"])/BNSCALE
        assetid = input_data["assetid"]
        if inputamount >= self.totalamount and self.assetid == assetid:
            return True
        return False

    def is_valid_output(self, output_data):
        outputamount = int(output_data["amt"])/BNSCALE
        assetid = output_data["assetid"]
        output_addr_len = output_data["outAddrLen"]
        if outputamount == self.assetamount and self.assetid == assetid and output_addr_len == 1:
            return True
        return False

    def remove_user(self, pubaddr, blacklist = True):
        self.utx = None
        self.stx = None
        self.stx_id = None
        self.remove_pubaddr(pubaddr)
        self.remove_input(pubaddr)
        self.remove_output(pubaddr)
        if self.state == COLLECT_SIGS:
            self.remove_sig(pubaddr)
        self.state == COLLECT_INPUTS
        if blacklist:
            self.blacklist.append(pubaddr)

    #Function that parses data, and makes sure that it is valid
    def process_request(self, request_data, conn, addr):
        ip = addr[0]
        pubaddr = JoinState.extract_pubaddr(request_data)
        messagetype = request_data["messagetype"]

        #if handling a nonce request
        if messagetype == REQUEST_NONCE:
            if self.state == COLLECT_SIGS and pubaddr not in self.pubaddresses:
                send_errmessage(conn, "Verification request denied, not in the coinjoin in the collect sigs stage")

            if self.in_pending_users(pubaddr):
                self.remove_from_pending(pubaddr)

            nonce = ''.join(choice(string.ascii_letters) for i in range(10))
            self.pending_users.append([pubaddr, nonce])
            send_nonce(conn, nonce)
            return

        #When handling a potential input
        elif messagetype == COLLECT_INPUTS:

            #get input and output data
            input_buf = JoinState.extract_inputbuf(request_data)
            output_buf = JoinState.extract_outputbuf(request_data)
            request_address = JoinState.extract_pubaddr(request_data)
            input_data = self.get_input_data(input_buf)
            output_data = self.get_output_data(output_buf)
            
            #if there was a problem forming either of these, send an error message and return
            if input_data == None or output_data == None:
                send_errmessage(conn, "could not read input and/or output data")
                return

            #Determine if the input is valid
            inputamount = int(input_data["amt"])/BNSCALE
            outputamount = int(output_data["amt"])/BNSCALE
            if self.state == COLLECT_INPUTS:
                if self.is_valid_input(input_data) and self.is_valid_output(output_data):
                    if input_data["assetid"] == output_data["assetid"] == self.assetid:
                        if True: #not ip in self.IP_addresses:       #XXX need to comment out for testing purposes
                            if pubaddr not in self.pubaddresses:
                                if self.in_pending_users(pubaddr):
                                    if self.verify_ticket(pubaddr, request_data["ticket"], self.get_pending_user_nonce(pubaddr)):
                                        #create input and output data when this has been determined to be valid information
                                        self.remove_from_pending(pubaddr)
                                        self.update_last_accessed()
                                        self.connections.append(conn)
                                        self.IP_addresses.append(ip)
                                        self.pubaddresses.append(pubaddr)

                                        self.inputs_append(input_buf, request_address, inputamount)
                                        self.outputs_append(output_buf, request_address, outputamount)

                                        print("collected fees: " + str(float((self.get_collected_fee_amt()))))
                                        send_message(conn, "transaction data accepted, please wait for other users to input data")

                                        for item in self.connections:
                                            send_message(item, "%d out of %d users connected" % (len(self.inputs), self.connect_limit))
                                        
                                        #when sufficient connections are created, go through the process of sending out the transaction
                                        if len(self.inputs) >= self.connect_limit:
                                            #add the fee to the outputs
                                            try: 
                                                self.utx = self.craft_utx()
                                            except Exception:
                                                self.send_errmessage_to_all("bad unsigned transaction data.  Send input again")
                                                self.reset_join()
                                                return
                                            #send out transaction to every user
                                            for item in self.connections:
                                                send_message(item, "all transactions complete, please input signature now")
                                                send_wiretx(item, self.utx)
                                            self.close_all_connections()
                                            self.initialize_sigs()
                                            self.IP_addresses = [] #delete ip addresses for security
                                            self.pending_users = []
                                            self.state = COLLECT_SIGS
                                        return
                                    else:
                                        print("nonce did not verify to pubaddr")
                                        send_errmessage(conn, "signature not associated with pubkey")
                                        return
                                else:
                                    print("user did not request permission to enter coinjoin")
                                    send_errmessage(conn, "did not request nonce to enter server")
                                    return
                            else:
                                print("already connected")
                                send_errmessage(conn, "Already connected")
                                return
                        else:
                            print("matching ip address already in use")
                            send_errmessage(conn, "matching ip address already in use")
                            return

                    else:
                        print("Mismatched asset-type")
                        send_errmessage(conn, "Mismatched asset-type")
                        return
                else:
                    print("Quantity of avax needs to be the same")
                    send_errmessage(conn, "Quantity insufficient")
                    return
            else:
                print("message not applicable, Join in input state")
                send_errmessage(conn, "Message not applicable, join not in input state")
                return

        #handles potential signature
        elif messagetype == COLLECT_SIGS:
            if self.state == COLLECT_SIGS:
                if pubaddr in self.pubaddresses:
                    if pubaddr not in self.get_all_signer_addrs():
                        if self.verify_sig(pubaddr, request_data["signature"]):
                            #When it has been determined that the signature is valid, continue through
                            self.update_last_accessed()
                            self.sigs_append(request_data["signature"], pubaddr)
                            self.connections.append(conn)
                            send_message(conn, "signature registered, waiting for others in the coinjoin")

                            for item in self.connections:
                                send_message(item, "%d out of %d users signed" % (self.get_current_signature_count(), self.connect_limit))

                            if self.get_current_signature_count() == self.connect_limit and len(self.sigs) >= self.connect_limit:
                                print("all signed")

                                try:
                                    self.stx = self.craft_stx()
                                except Exception:
                                    print("transaction didn't form properly")
                                    self.send_errmessage_to_all("transaction didn't form properly, send signature again")
                                    self.set_to_collect_sigs()
                                    return

                                timeout = 1000
                                for item in self.connections:
                                    send_message(item, "all participants have signed, submitting to blockchain")
                                    send_signedtx(item, {"stx": self.stx, "timeout": timeout})
                                    timeout += 100

                                status_data = self.issue_stx()
                                if status_data["status"] == "Accepted":
                                    print("transaction accepted")
                                    for item in self.connections:
                                        send_message(item, "tx accepted onto blockchain")
                                        send_accepted_txid(item, status_data["id"])
                                elif status_data["status"] == "Rejected":
                                    print("tx not accepted onto the blockchain")

                                self.close_all_connections()
                                self.reset_join()
                                return
                            return
                        else:
                            print("signature does not belong to pubaddr")
                            send_errmessage(conn, "this signature does not belong to the public key provided")
                    else:
                        print("already signed")
                        send_errmessage(conn, "already signed")
                        return
                else:
                    print("join is full")
                    send_errmessage(conn, "Join is full, already in signing state")
                    return
            else:
                print("not a message for signature state")
                send_errmessage(conn, "Message not applicable, join not in signature state")
                return

        #handles wiretx request
        elif messagetype == REQUEST_WTX:
            if self.state == COLLECT_SIGS:
                if pubaddr in self.pubaddresses:
                    print("sending wiretx to participant")
                    send_message(conn, "sending wiretx information over")
                    send_wiretx(conn, self.utx)
                    return
                else:
                    print("not part of join, cannot request wiretx")
                    send_errmessage(conn, "not part of join, canont request wiretx")
                    return
            else:
                print("not in collect sigs, cannot send wiretx")
                send_errmessage(conn, "cannot send wiretx, join not in collectsigs state")
                return

        elif messagetype == EXIT:
            if pubaddr in self.pubaddresses:
                if self.in_pending_users(pubaddr):
                    if self.verify_ticket(pubaddr, request_data["ticket"], self.get_pending_user_nonce(pubaddr)):
                        self.remove_from_pending(pubaddr)
                        print("removing user %s" % pubaddr)
                        self.remove_user(pubaddr)
                        send_message(conn, "user %s has been removed from the CJ" % pubaddr)
                        return
                    else:
                        print("cannot validate user, will not remove")
                        send_errmessage(conn, "validation failed, user will not be removed")
                        return
                else:
                    print("user didn't request a nonce beforehand, cannot validate")
                    send_errmessage(conn, "did not request a nonce for validation, user will not be removed")
                    return
            else:
                print("user not in CJ")
                send_errmessage(conn, "User cannot be removed because %s is not in the CJ" % pubaddr)
                return

        else:
            print("not in a valid state")
            send_errmessage(conn, "in invalid state")
            return

    def __str__(self):
        returnstring = ""
        status =  self.get_status()
        for item in status:
            returnstring += item + " = " + str(status[item]) + "\r\n"
        return returnstring