import json

from HTTPRequest import *
from params import *

#This is a class which holds all the data for a coinjoin.  The CoinJoin has two main states that it can be in:  collecting utxo inputs and collecting
#signatures.  

class JoinState:

    def __init__(self, id = "test", connect_limit = 5, assettype = 1, assetamount = 10, 
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
        self.last_accessed = "x"
        self.IP_addresses = []
        self.connections = []
        self.signers = []
        self.inputs = []
        self.outputs = []

        if not self.isvalid_join():
            raise Exception("bad parameters")

    def isvalid_join(self):
        if type(self.id) != int:
            return False
        if self.connect_limit < 2 or self.connect_limit > CONNECT_LIMIT_MAX:
            return False
        if self.assetamount <= 0:
            return False
        if self.feepercent < 0 or self.feepercent >= 1:
            return False
        return True

    def get_current_signature_count(self):
        count = 0
        for item in self.signers:
            if item != None:
                count += 1
        return count

    #function that returns the current status of the join in json form, for easy access
    def get_status(self):
        if self.state == COLLECT_INPUTS:
            status = {
                "id": self.id,
                "state": self.state,
                "connect_limit": self.connect_limit,
                "current_connection_count": len(self.connections),
                "base_amount": self.assetamount,
                "fee_percent":  self.feepercent,
                "total_amount": self.totalamount
                }
        elif self.state == COLLECT_SIGS:
            status = {
                "id": self.id,
                "state": self.state,
                "signatures_needed": self.connect_limit,
                "current_signature_count": self.get_current_signature_count(),
                "base_amount": self.assetamount,
                "fee_percent": self.feepercent,
                "total_amount": self.totalamount
            }
        else:
            Exception("bad")
        return json.dumps(status)

    #Creates 
    def create_output(self, coinid, destinationaddr, amount, ip):
        TxOut = {"coinid": coinid, "amount": amount, "destinationaddr": destinationaddr}
        return [TxOut, ip]
        
    def create_input(self, request_data, ip):
        TxInp = {"coinid": request_data["assettype"], "amount": request_data["assetamount"], 
            "utxo": request_data["utxo"], "utxooffset": request_data["utxooffset"]}
        return [TxInp, ip]

    def sort_inputs(self):
        #Convert utxo hash to binary, and then sort based on this
        for item in self.inputs:
            item.append(int(bin(int(item[0]["utxo"], 16))[2:]))
        self.inputs = sorted(self.inputs, key=lambda x:x[2])
        for item in self.inputs:
            item.pop()

    def sort_outputs(self):
        self.outputs.sort(key=lambda x: x[0]["destinationaddr"])

    def inputs_append(self, request_data, ip):  #XXX maybe change this from host ip to public key?
        input = self.create_input(request_data, ip)
        self.inputs.append(input)
        self.sort_inputs()

    def outputs_append(self, coinid, destination_addr, amount, ip): #XXX maybe change this form host ip to public key?
        output = self.create_output(coinid, destination_addr, amount, ip)
        self.outputs.append(output)
        self.sort_outputs()

    def outputs_append_fee(self, ip):
        self.outputs_append(self.assettype, self.feeaddress, self.collected_fee_amount, ip)
        
    def signers_append(self, signature, ip):
        inputs, ips = map(list, zip(*self.inputs))
        index = ips.index(ip)
        self.signers[index] = [signature, ip]

    def initialize_signers(self):
        #Makes the signers list full of None objects to be replaced by signature objects
        for i in range(len(self.connections)):
            self.signers.append(None)

    def extract_inputs(self):
        #returns only the input data, not the ip addreses, from the input list
        inputs, ips = map(list, zip(*self.inputs))
        return inputs

    def extract_outputs(self):
        #returns only the output data, not the ip addresses, from the output list
        outputs, ips = map(list, zip(*self.outputs))
        return outputs

    def craft_transaction(self):
        return {"inputs": self.extract_inputs(),"outputs": self.extract_outputs()}

    #Function that parses data, and makes sure that it is valid
    def process_request(self, request_data, conn, HOST):

        #collect inputs state
        if self.state == COLLECT_INPUTS:
            if request_data["messagetype"] == "input":
                if request_data["assetamount"] >= self.totalamount:
                    if request_data["assettype"] == self.assettype:
                        if True: #not HOST in self.IP_addresses:       #XXX need to comment out for testing purposes
                            if conn not in self.connections:
                                self.connections.append(conn)
                                self.IP_addresses.append(HOST)
                                self.inputs_append(request_data, HOST)      
                                self.outputs_append(request_data["assettype"],   
                                    request_data["destinationaddr"], 
                                    self.assetamount, HOST)

                                self.collected_fee_amount += request_data["assetamount"] - self.assetamount
                                print("collected fees: " + str(self.collected_fee_amount))
                                
                                #when sufficient connections are created, go through the process of sending out the transaction
                                if len(self.connections) >= self.connect_limit:
                                    self.outputs_append_fee(None) #create an output for fee transactions
                                    tx = self.craft_transaction()
                                    print(tx)
                                    for item in self.connections:
                                        item.sendall(b"transaction placeholder:")
                                    self.initialize_signers()
                                    self.state = COLLECT_SIGS
                                return
                        
                            else:
                                print("already connected")
                                conn.sendall(b"Already connected")
                                return
                        else:
                            print("matching ip address already in use")
                            conn.sendall(b"matching ip address already in use")

                    else:
                        print("Mismatched asset-type")
                        conn.sendall(b"Mismatched asset-type")
                        return
                else:
                    print("Quantity of avax needs to be the same")
                    conn.sendall(b"Quantity of avax needs to be the same")
                    return
            else:
                print("message not applicable, Join in input state")
                conn.sendall(b"Message not applicable, Join in input state")
                return

        #collect sigs state
        elif self.state == COLLECT_SIGS:
            if request_data["messagetype"] == "signature":
                if True: #conn in self.connections:       #XXX commented out for testing purposes
                    if conn not in self.signers:
                        self.signers_append(request_data["signature"], HOST)   
                        print(self.signers)
                        if None not in self.signers and len(self.signers) >= self.connect_limit:
                            print("all signed")
                            for item in self.connections:
                                item.sendall(self.inputs + b"\r\n")
                            self.state = DONE
                        return
                    else:
                        print("already signed")
                        conn.sendall(b"already signed")
                        return
                else:
                    print("join is full")
                    conn.sendall(b"Join is full")
                    return
            else:
                print("not a message for signature state")
                conn.sendall(b"Message not applicable, Join in signature state")
                return
        elif self.state == DONE:
            pass
        else:
            conn.sendall(b"in invalid state")

    def __str__(self):
        return self.get_status()