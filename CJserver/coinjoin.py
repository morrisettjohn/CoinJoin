import json
import time

import bech32

from messages import send_errmessage, send_message, send_signedtx, send_wiretx
from httprequest import *
from params import *
from decimal import Decimal, getcontext
from struct import *
from cb58ref import cb58decode, cb58encode
from bech32 import bech32_encode, bech32_decode
from bech32utils import fromWords, toWords, bech32_pack_address
from bufferutils import pack_out, unpack_inp, unpack_out

getcontext().prec = 9


#This is a class which holds all the data for a coinjoin.  The CoinJoin has two main states that it can be in:  collecting utxo inputs and collecting
#signatures.  

class JoinState:

    def __init__(self, id = "test", connect_limit:int = DEFAULT_LOWER_USER_BOUND, assetid:str = 1, assetamount = 1, 
            feeaddress:str = "", feepercent = Decimal(0.10)):

        self.id = id
        self.connect_limit = connect_limit
        self.assetid = assetid
        self.assetamount = assetamount
        self.feepercent = feepercent
        self.totalamount = assetamount + assetamount * feepercent
        self.feeaddress = feeaddress
        self.state = COLLECT_INPUTS
        self.collected_fee_amount = Decimal(0)
        self.last_accessed = time.time()
        self.tx = None
        self.pubaddresses = []
        self.IP_addresses = []  #XXX
        self.connections = []
        self.signers = []
        self.inputs = []
        self.outputs = []

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

    #updates when the join was last accessed
    def update_last_accessed(self):
        self.last_accessed = time.time()

    #error checking when creating joins, check if parameters are valid
    def isvalid_join(self):
        if type(self.id) != int:
            return False
        if self.connect_limit < MIN_USER_BOUND or self.connect_limit > MAX_USER_BOUND:
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
        for i in range(len(self.connections)):
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

    #returns only the output data, not the ip addresses, from the output list
    def extract_outputs(self):
        outputs, pubaddresses = map(list, zip(*self.outputs))
        return outputs
    
    #creates all of the 
    def craft_wire_transaction(self):
        return json.dumps({"inputs": self.inputs,"outputs": self.extract_outputs()})

    def craft_signed_transaction_data(self):
        return json.dumps({"signatures": self.signers, "transaction": self.tx})

    #Function that parses data, and makes sure that it is valid
    def process_request(self, request_data, conn, addr):
        ip = addr[0]
        pubaddr = JoinState.extract_pubaddr(request_data)

        if request_data["messagetype"] == COLLECT_INPUTS:
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
                                    self.add_fee_output()
                                    wire_tx = self.craft_wire_transaction()
                                    
                                    #send out transaction to every user
                                    for item in self.connections:
                                        send_message(item, "all transactions complete, please input signature now")
                                        send_wiretx(item, wire_tx)
                                    self.initialize_signers()
                                    self.IP_addresses = [] #delete ip addresses for security
                                    self.connections = []  #reset connections
                                    self.state = COLLECT_SIGS
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
                if pubaddr in self.pubaddresses:       #XXX commented out for testing purposes
                    if pubaddr not in self.signers:
                        #When it has been determined that the signature is valid, continue through
                        self.update_last_accessed()
                        self.signers_append(request_data["signature"], pubaddr)
                        self.connections.append(conn)
                        self.tx = request_data["transaction"]
                        send_message(conn, "signature registered, waiting for others in the coinjoin")

                        for item in self.connections:
                            send_message(item, "%d out of %d users signed" % (self.get_current_signature_count(), self.connect_limit))

                        if None not in self.signers and len(self.signers) >= self.connect_limit:
                            print("all signed")
                            signed_tx = self.craft_signed_transaction_data()
                            for item in self.connections:
                                send_message(item, "all participants have signed")
                                send_signedtx(item, signed_tx)
                            self.state = ISSUE_TX
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
                    send_wiretx(conn, self.craft_wire_transaction())
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