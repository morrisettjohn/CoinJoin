import json
import time

from HTTPRequest import *
from params import *
import socket

#This is a class which holds all the data for a coinjoin.  The CoinJoin has two main states that it can be in:  collecting utxo inputs and collecting
#signatures.  

class JoinState:

    def __init__(self, id = "test", connect_limit = DEFAULT_LOWER_USER_BOUND, assettype = 1, assetamount = 10, 
            feeaddress = "", feepercent = 0.10):

        self.id = id
        self.connect_limit = connect_limit
        self.assettype = assettype
        self.assetamount = assetamount
        self.feepercent = feepercent
        self.totalamount = assetamount + assetamount * feepercent
        self.feeaddress = feeaddress
        self.state = COLLECT_INPUTS
        self.collected_fee_amount = 0
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

    def get_pubaddr(request_data):
        return request_data["pubaddr"]

    #Returns the number of signatures that have joined during the signature stage
    def get_current_signature_count(self):
        count = 0
        for item in self.signers:
            if item != None:
                count += 1
        return count

    #Returns the number of connections that have joined during the input stage
    def get_current_connection_count(self):
        return len(self.connections)

    #function that returns the current status of the join in json form, for easy access
    def get_status(self):
        if self.state == COLLECT_INPUTS:
            status = {
                "id": self.id,
                "state": self.state,
                "connect_limit": self.connect_limit,
                "current_connection_count": self.get_current_connection_count(),
                "base_amount": self.assetamount,
                "fee_percent":  self.feepercent,
                "total_amount": self.totalamount,
                "last_accessed": self.last_accessed
                }
        elif self.state == COLLECT_SIGS:
            status = {
                "id": self.id,
                "state": self.state,
                "signatures_needed": self.connect_limit,
                "current_signature_count": self.get_current_signature_count(),
                "base_amount": self.assetamount,
                "fee_percent": self.feepercent,
                "total_amount": self.totalamount,
                "last_accessed": self.last_accessed
            }
        else:
            Exception("bad")
        return status

    def create_output(self, coinid, destinationaddr, amount, pubaddr):
        TxOut = {"coinid": coinid, "amount": amount, "destinationaddr": destinationaddr}
        return [TxOut, pubaddr]
        
    def create_input(self, request_data):
        pubaddr = JoinState.get_pubaddr(request_data)
        TxInp = {"coinid": request_data["assettype"], "amount": request_data["assetamount"], 
            "utxo": request_data["utxo"], "utxooffset": request_data["utxooffset"], "pubaddr": pubaddr}
        return [TxInp, pubaddr]

    #Convert utxo hash to binary, and then sort based on said hash
    def sort_inputs(self):
        for item in self.inputs:
            item.append(int(bin(int(item[0]["utxo"], 16))[2:]))
        self.inputs = sorted(self.inputs, key=lambda x:x[2])
        for item in self.inputs:
            item.pop()

    #Sort outputs based on destination address
    def sort_outputs(self):
        self.outputs.sort(key=lambda x: x[0]["destinationaddr"])

    #Creates a new input, and then sorts the entire list
    def inputs_append(self, request_data):  
        input = self.create_input(request_data)
        self.inputs.append(input)
        self.sort_inputs()

    #Creates a new output, then sorts the entire list
    def outputs_append(self, coinid, destination_addr, amount, pubaddr):
        output = self.create_output(coinid, destination_addr, amount, pubaddr)
        self.outputs.append(output)
        self.sort_outputs()

    #Create the fee output data
    def outputs_append_fee(self, pubaddr):
        self.outputs_append(self.assettype, self.feeaddress, self.collected_fee_amount, pubaddr)
        
    #Add a new signature to the list.  Signatures should be in the same order as inputs, so they are ordered as such.
    def signers_append(self, signature, pubaddr):
        inputs, pubaddresses = map(list, zip(*self.inputs))
        index = pubaddresses.index(pubaddr)  #Determines where the ip is in the list
        self.signers[index] = [signature, pubaddr]  #Based on the index of the ip established before, assigns the none object to be an index

    #Initializes the signer data, by creating a list full of None objects, so that signatures can be appended in the correct order
    def initialize_signers(self):
        for i in range(len(self.connections)):
            self.signers.append(None)

    #returns only the input data, not the ip addreses, from the input list
    def extract_inputs(self):
        inputs, ips = map(list, zip(*self.inputs))
        return inputs

    #returns only the output data, not the ip addresses, from the output list
    def extract_outputs(self):
        outputs, ips = map(list, zip(*self.outputs))
        return outputs

    def craft_transaction(self):
        return {"inputs": self.extract_inputs(),"outputs": self.extract_outputs()}

    #Function that parses data, and makes sure that it is valid
    def process_request(self, request_data, conn, addr):
        ip = addr[0]
        pubaddr = JoinState.get_pubaddr(request_data)

        if self.state == COLLECT_INPUTS:
            if request_data["messagetype"] == COLLECT_INPUTS:
                if request_data["assetamount"] >= self.totalamount:
                    if request_data["assettype"] == self.assettype:
                        if True: #not ip in self.IP_addresses:       #XXX need to comment out for testing purposes
                            if pubaddr not in self.pubaddresses:
                                #create input and output data when this has been determined to be valid information
                                self.update_last_accessed()
                                self.connections.append(conn)
                                self.IP_addresses.append(ip)
                                self.pubaddresses.append(pubaddr)
                                
                                self.inputs_append(request_data)
                                self.outputs_append(request_data["assettype"],   
                                    request_data["destinationaddr"], 
                                    self.assetamount, pubaddr)

                                #update the fee amounts
                                self.collected_fee_amount += request_data["assetamount"] - self.assetamount
                                print("collected fees: " + str(self.collected_fee_amount))
                                conn.sendall(b"transaction data accepted, please wait for other users to input data")
                                
                                #when sufficient connections are created, go through the process of sending out the transaction
                                if len(self.connections) >= self.connect_limit:
                                    self.outputs_append_fee(None) #create an output for fee transactions
                                    conn.sendall(b"all transactions complete, please input signature now\r\n\r\n")
                                    tx = self.craft_transaction()
                                    self.tx = tx
                                    print(tx)
                                    #send out transaction to every user
                                    for item in self.connections:
                                        item.sendall(str.encode(json.dumps(tx)))
                                        item.close()
                                    self.initialize_signers()
                                    self.IP_addresses = [] #delete ip addresses for security
                                    self.connections = []  #reset connections
                                    self.state = COLLECT_SIGS
                                return
                            else:
                                print("already connected")
                                conn.sendall(b"Already connected")
                                conn.close()
                                return
                        else:
                            print("matching ip address already in use")
                            conn.sendall(b"matching ip address already in use")
                            conn.close()
                            return

                    else:
                        print("Mismatched asset-type")
                        conn.sendall(b"Mismatched asset-type")
                        conn.close()
                        return
                else:
                    print("Quantity of avax needs to be the same")
                    conn.sendall(b"Quantity of avax needs to be the same")
                    conn.close()
                    return
            else:
                print("message not applicable, Join in input state")
                conn.sendall(b"Message not applicable, Join in input state")
                conn.close()
                return

        #collect sigs state
        elif self.state == COLLECT_SIGS:
            if request_data["messagetype"] == COLLECT_SIGS:
                if pubaddr in self.pubaddresses:       #XXX commented out for testing purposes
                    if pubaddr not in self.signers:
                        #When it has been determined that the signature is valid, continue through
                        self.update_last_accessed()
                        self.signers_append(request_data["signature"], pubaddr)
                        self.connections.append(conn)
                        print(self.signers)
                        if None not in self.signers and len(self.signers) >= self.connect_limit:
                            print("all signed")
                            for item in self.connections:
                                item.sendall(str.encode(json.dumps({"signatures": self.signers,"transaction": self.tx})))
                                item.close()
                            self.state = DONE
                        return
                    else:
                        print("already signed")
                        conn.sendall(b"already signed")
                        conn.close()
                        return
                else:
                    print("join is full")
                    conn.sendall(b"Join is full")
                    conn.close()
                    return
            else:
                print("not a message for signature state")
                conn.sendall(b"Message not applicable, Join in signature state")
                conn.close()
                return
        elif self.state == DONE:
            pass
        else:
            conn.sendall(b"in invalid state")
            conn.close()

    def __str__(self):
        return self.get_status()