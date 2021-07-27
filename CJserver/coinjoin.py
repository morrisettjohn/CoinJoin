import json
import subprocess
import time
import string

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

    def __init__(self, id = "test", connect_limit:int = DEFAULT_LOWER_USER_BOUND, assetid:str = 1, assetamount = 1, 
            feeaddress:str = "", feepercent = Decimal(0.10), networkID = FUJI, debug_mode: bool = False):

        self.id = id
        self.connect_limit = connect_limit
        self.assetid = assetid
        self.assetamount = assetamount
        self.feepercent = feepercent
        self.totalamount = assetamount + assetamount * feepercent
        self.feeaddress = feeaddress
        self.state = COLLECT_INPUTS
        self.networkID = networkID
        self.collected_fee_amount = Decimal(0)
        self.last_accessed = time.time()
        self.utx = None
        self.stx = None
        self.stx_id = None
        self.pubaddresses = []
        self.pending_users = []
        self.IP_addresses = []
        self.connections = []
        self.signers = []
        self.inputs = []
        self.outputs = []
        self.debug_mode = debug_mode

        if not self.isvalid_join():
            raise Exception("bad parameters")

    #Returns the number of connections that have joined during the input stage
    def get_current_input_count(self):
        return len(self.inputs)

    #Returns the number of signatures that have joined during the signature stage
    def get_current_signature_count(self):
        count = 0
        for item in self.signers:
            if item != None:
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
        return float(self.collected_fee_amount - Decimal(STANDARD_BURN_AMOUNT))

    def reset_join(self):
        self.state = COLLECT_INPUTS
        self.collected_fee_amount = Decimal(0)
        self.last_accessed = time.time()
        self.utx = None
        self.stx = None
        self.stx_id = None
        self.pubaddresses = []
        self.pending_users = []
        self.IP_addresses = []
        self.connections = []
        self.signers = []
        self.inputs = []
        self.outputs = []

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
    def inputs_append(self, inputbuf, pubaddr):  
        input = self.create_input(inputbuf, pubaddr)
        self.inputs.append(input)
        self.sort_inputs()

    #Creates a new output, then sorts the entire list
    def outputs_append(self, outputbuf, pubaddr):
        output = self.create_output(outputbuf, pubaddr)
        self.outputs.append(output)
        self.sort_outputs()

    def add_fee_output(self):
        fee_buffer_data = pack_out(self.assetid, int(self.get_fee_after_burn()*BNSCALE), 0, 1, [self.feeaddress])
        fee_output = {"type": "Buffer", "data": fee_buffer_data}
        self.outputs_append(fee_output, self.feeaddress)

    def create_input(self, inputbuf, pubaddr):
        return [inputbuf, pubaddr]

    def create_output(self, outputbuf, pubaddr):
        return [outputbuf, pubaddr]
        
    #Convert utxo hash to binary, and then sort based on said hash
    def sort_inputs(self):
        self.inputs = sorted(self.inputs, key=lambda x:x[0]["data"])
        
    #Sort outputs based on destination address
    def sort_outputs(self):
        self.outputs = sorted(self.outputs, key=lambda x: x[0]["data"])
        
    #Add a new signature to the list.  Signatures should be in the same order as inputs, so they are ordered as such.
    def signers_append(self, signature, pubaddr):
        inputs, pubaddresses = map(list, zip(*self.inputs))
        index = pubaddresses.index(pubaddr)  #Determines where the ip is in the list
        self.signers[index] = [signature, pubaddr]  #Based on the index of the ip established before, assigns the none object to be an index
        
    #Initializes the signer data, by creating a list full of None objects, so that signatures can be appended in the correct order
    def initialize_signers(self):
        for i in range(len(self.inputs)):
            self.signers.append(None)

    #extracts inputs from request data
    def extract_inputbuf(request_data):
        return request_data["inputbuf"]

    #extracts outputs from request data
    def extract_outputbuf(request_data):
        return request_data["outputbuf"]

    #extracts the public address from request data
    def extract_pubaddr(request_data):
        return request_data["pubaddr"]

    def extract_inputs(self):
        inputs, pubaddresses = map(list, zip(*self.inputs))
        return inputs

    #returns only the output data, not the ip addresses, from the output list
    def extract_outputs(self):
        outputs, pubaddresses = map(list, zip(*self.outputs))
        return outputs

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
        except Exception:
            print(result.stderr)
        ticket_val = bytes.decode(result.stdout)

        if ticket_val == "true":
            return True
        return False
    
    #creates all of the 
    def craft_utx(self):
        fee_data = {
            "assetid": self.assetid, 
            "amount": int(self.get_fee_after_burn()*BNSCALE), 
            "address": self.feeaddress
        }

        wiretx_data = str.encode(json.dumps({
            "inputs": self.extract_inputs(),
            "outputs": self.extract_outputs(),
            "networkID": self.networkID,
            "feedata": fee_data
        }))

        result = subprocess.run(['node', './js_scripts/craftunsignedtx.js'], input = wiretx_data, capture_output=True)

        try:
            result.check_returncode()
        except Exception:
            raise Exception("bad transaction data")
        
        unsignedTxBuf = convert_to_jsbuffer(result.stdout)
        return unsignedTxBuf

    def craft_stx(self):
        stx_data = str.encode(json.dumps({
            "signatures": self.signers,
            "utx": self.utx,
        }))

        result = subprocess.run(['node', './js_scripts/craftsignedtx.js'], input = stx_data, capture_output=True)
        try:
            result.check_returncode()
        except Exception:
            raise Exception("bad stx data")
        
        signedTxBuf = convert_to_jsbuffer(result.stdout)
        return signedTxBuf

    def issue_stx(self):
        issue_data = str.encode(json.dumps({
            "stx": self.stx,
            "networkID": self.networkID
        }))

        result = subprocess.run(['node', './js_scripts/issuestx.js'], input = issue_data, capture_output=True)
        try:
            result.check_returncode()
        except Exception:
            raise Exception("something went wrong")
        result_data = json.loads(bytes.decode((result.stdout)))
        return result_data


    def in_pending_users(self, pubaddress):
        if self.pending_users == []:
            return False
        pubaddresses, nonces = map(list, zip(*self.pending_users))
        if pubaddress in pubaddresses:
            return True
        return False
    
    def get_nonce(self, pubaddress):
        pubaddresses, nonces = map(list, zip(*self.pending_users))
        return nonces[pubaddresses.index(pubaddress)]
        
    def close_all_connections(self):
        for item in self.connections:
            item.close()
        self.connections = []

    #Function that parses data, and makes sure that it is valid
    def process_request(self, request_data, conn, addr):
        ip = addr[0]
        pubaddr = JoinState.extract_pubaddr(request_data)

        if request_data["messagetype"] == REQUEST_TO_JOIN:
            if self.state == COLLECT_SIGS and pubaddr not in self.pubaddresses:
                send_errmessage(conn, "Verification request denied, not in the coinjoin in the collect sigs stage")

            if self.in_pending_users(pubaddr):
                pubaddresses, nonces = map(list, zip(*self.pending_users))
                self.pending_users.pop(pubaddresses.index(pubaddr))

            nonce = ''.join(choice(string.ascii_letters) for i in range(10))
            self.pending_users.append([pubaddr, nonce])
            send_nonce(conn, nonce)

        elif request_data["messagetype"] == COLLECT_INPUTS:
            input_buf = JoinState.extract_inputbuf(request_data)
            output_buf = JoinState.extract_outputbuf(request_data)
            request_address = JoinState.extract_pubaddr(request_data)
            input_data = unpack_inp(input_buf["data"])
            output_data = unpack_out(output_buf["data"])
            inputamount = input_data["inputamount"]/BNSCALE
            outputamount = output_data["outputamount"]/BNSCALE
            if self.state == COLLECT_INPUTS:
                if inputamount >= self.totalamount and outputamount == self.assetamount:
                    if input_data["assetid"] == output_data["assetid"] == self.assetid:
                        if True: #not ip in self.IP_addresses:       #XXX need to comment out for testing purposes
                            if pubaddr not in self.pubaddresses:
                                if self.in_pending_users(pubaddr):
                                    if self.verify_ticket(pubaddr, request_data["ticket"], self.get_nonce(pubaddr)):
                                        #create input and output data when this has been determined to be valid information
                                        self.update_last_accessed()
                                        self.connections.append(conn)
                                        self.IP_addresses.append(ip)
                                        self.pubaddresses.append(pubaddr)

                                        self.inputs_append(input_buf, request_address)
                                        self.outputs_append(output_buf, request_address)

                                        self.collected_fee_amount += Decimal(inputamount) - Decimal(self.assetamount)
                                        print("collected fees: " + str(float((self.collected_fee_amount))))
                                        send_message(conn, "transaction data accepted, please wait for other users to input data")

                                        for item in self.connections:
                                            send_message(item, "%d out of %d users connected" % (len(self.inputs), self.connect_limit))
                                        
                                        #when sufficient connections are created, go through the process of sending out the transaction
                                        if len(self.inputs) >= self.connect_limit:
                                            #add the fee to the outputs
                                            self.utx = self.craft_utx()

                                            #send out transaction to every user
                                            for item in self.connections:
                                                send_message(item, "all transactions complete, please input signature now")
                                                send_wiretx(item, self.utx)
                                            self.close_all_connections()
                                            self.initialize_signers()
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

        #collect sigs state
        elif request_data["messagetype"] == COLLECT_SIGS:
            if self.state == COLLECT_SIGS:
                if pubaddr in self.pubaddresses:
                    if pubaddr not in self.signers:
                        if self.in_pending_users(pubaddr):
                            if self.verify_ticket(pubaddr, request_data["ticket"], self.get_nonce(pubaddr)):
                                #When it has been determined that the signature is valid, continue through
                                self.update_last_accessed()
                                self.signers_append(request_data["signature"], pubaddr)
                                self.connections.append(conn)
                                send_message(conn, "signature registered, waiting for others in the coinjoin")

                                for item in self.connections:
                                    send_message(item, "%d out of %d users signed" % (self.get_current_signature_count(), self.connect_limit))

                                if None not in self.signers and len(self.signers) >= self.connect_limit:
                                    print("all signed")
                                    self.stx = self.craft_stx()

                                    timeout = 1000
                                    for item in self.connections:
                                        send_message(item, "all participants have signed, submitting to blockchain")
                                        send_signedtx(item, {"stx": self.stx, "timeout": timeout})
                                        timeout += 100
                                    status_data = self.issue_stx()
                                    if status_data["status"] == "Accepted":
                                        for item in self.connections:
                                            print("transaction accepted")
                                            send_message(item, "tx accepted onto blockchain")
                                            send_accepted_txid(item, status_data["id"])
                                    elif status_data["status"] == "Rejected":
                                        print("tx not accepted onto the blockchain")

                                    self.close_all_connections()
                                    self.reset_join()
                                return
                            else:
                                print("verification failed")
                                send_errmessage(conn, "verification failed")
                        else:
                            print("did not request verification nonce")
                            send_errmessage(conn, "please request a verification nonce before signing")
                            return
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

        elif request_data["messagetype"] == REQUEST_WTX:
            if self.state == COLLECT_SIGS:
                if pubaddr in self.pubaddresses:
                    print("sending wiretx to participant")
                    send_message(conn, "sending wiretx information over")
                    send_wiretx(conn, self.utx)
                else:
                    print("not part of join, cannot request wiretx")
                    send_errmessage(conn, "not part of join, canont request wiretx")
                    return
            else:
                print("not in collect sigs, cannot send wiretx")
                send_errmessage(conn, "cannot send wiretx, join not in collectsigs state")
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