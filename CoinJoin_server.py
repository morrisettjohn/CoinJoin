import socket
import json
import sys

#from transaction import *
from HTTPRequest import *


joins = []

#Parses raw http header data
  

#Class which holds all the coinjoin data
class JoinState:
    COLLECT_INPUTS, COLLECT_SIGS, DONE = range(3)

    def __init__(self, id = "test", connect_limit = 5, assettype = 1, assetamount = 10, 
            feeaddress = "", feepercent = 0.10):
        if feepercent < 0 or feepercent > 1:
            return Exception("fee must be a valid percentage of the total amount")

        self.id = id
        self.connect_limit = connect_limit
        self.assettype = assettype
        self.assetamount = assetamount
        self.feepercent = feepercent
        self.totalamount = assetamount + assetamount * feepercent
        self.feeaddress = feeaddress
        self.state = JoinState.COLLECT_INPUTS
        self.collected_fee_amount = 0
        self.IP_addresses = []
        self.connections = []
        self.signers = []
        self.inputs = []
        self.outputs = []

    def find_join(request_data):
        joinid = request_data["joinid"]
        for join in joins:
            if join.id == joinid:
                return join
        return None

    def take_inputdata(data):
        return data[0]["utxo"]

    #previous create_input 
    #def create_input(request_data, conn):
        #return [MultisigInput(
            #request_data["utxo"],
            #request_data["utxooffset"],
            #request_data["assettype"],
            #request_data["amount"],
            #10,
        #), conn]

    #def create_output(self, destinationaddr, amount, conn):
        #return [MultisigOutput(
            #amount,
            #10,
            #self.assettype,
            #threshold=1,
            #addresses= destinationaddr,
        #), conn]

    def create_output(self, coinid, destinationaddr, amount, conn):
        TxOut = {"coinid": coinid, "amount": amount, "destinationaddr": destinationaddr}
        return [TxOut, conn]
        
    def create_input(self, request_data, conn):
        TxInp = {"coinid": request_data["assettype"], "amount": request_data["assetamount"], 
            "utxo": request_data["utxo"], "utxooffset": request_data["utxooffset"]}
        return [TxInp, conn]

    def sort_inputs(self):
        for item in self.inputs:
            item.append(int(bin(int(item[0]["utxo"], 16))[2:]))
        self.inputs = sorted(self.inputs, key=lambda x:x[2])
        for item in self.inputs:
            item.pop()

    def sort_outputs(self):
        #XXX sort lexigraphically
        self.outputs.sort()

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
        return bytes({"inputs": self.extract_inputs(),"outputs": self.extract_outputs()})

    def isvalid_request(request_data):
        if request_data.command != 'POST':
            return False
        if request_data.path != '/':
            return False
        if not request_data.request_version.startswith("HTTP/1"):
            return False
        if not "Content-Length" in request_data.headers:
            return False
        return True

    def isvalid_jsondata(request_data):
        if not "joinid" in request_data or JoinState.find_join(request_data) == None:
            return False
        if not "messagetype" in request_data:
            return False
        if request_data["messagetype"] == "input":
            if "utxo" in request_data and "utxooffset" in request_data and "assetamount" in request_data and "assettype" in request_data and "destinationaddr" in request_data:
                return True
            return False
        elif request_data["messagetype"] == "signature":
            if "signature" in request_data:
                return True
            return False
        else:
            return False
                
    def request_length(req):
        return int(req.headers['Content-Length'])
        
    def process_header(conn, message):
        req = HTTPRequest(message)
        if not JoinState.isvalid_request(req):
            return -1
        return JoinState.request_length(req)

    def get_utxo_amount(utxo, offset):
        #XXX need to actually get utxo data
        return 15

    def process_request(self, request_data, conn, HOST):
        if self.state == JoinState.COLLECT_INPUTS:
            if request_data["messagetype"] == "input":
                if request_data["assetamount"] >= self.totalamount:
                    if request_data["assettype"] == self.assettype:
                        if not HOST in self.IP_addresses:
                            if conn not in self.connections:
                                print("hi")
                                self.connections.append(conn)
                                self.IP_addresses.append(HOST)
                                self.inputs_append(request_data, HOST)
                                self.outputs_append(request_data["assettype"], request_data["destinationaddr"], request_data["assetamount"], HOST)

                                self.collected_fee_amount += request_data["assetamount"] - self.assetamount

                                #If the input is greater than the amount requirement and fee requirement, return that value
                                #if utxo_amount > self.assetamount + self.feeamount:  #XXX send to surplus
                                    #self.outputs_append(senderaddress, request_data["assetamount"] - self.assetamount - self.feeamount, HOST)
                                
                                #when sufficient connections are created, go through the process of sending out the transaction
                                if len(self.connections) >= self.connect_limit:
                                    self.outputs_append_fee(None) #create an output for fee transactions
                                    tx = self.craft_transaction()
                                    for item in self.connections:
                                        item.sendall(tx)
                                    self.initialize_signers()
                                    self.state = JoinState.COLLECT_SIGS
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
                    print("Quanitty of avax needs to be the same")
                    conn.sendall(b"Quantity of avax needs to be the same")
                    return
            else:
                print("message not applicable, Join in input state")
                conn.sendall(b"Message not applicable, Join in input state")
                return

        elif self.state == JoinState.COLLECT_SIGS:
            if request_data["messagetype"] != "signature":
                if conn in self.connections:
                    if conn not in self.signers:
                        self.signers_append(request_data["signature"], HOST)

                        if len(self.signers) >= self.connect_limit:
                            for item in self.signers:
                                item.sendall(self.inputs + b"\r\n")
                            self.state = JoinState.DONE
                        return
                    else:
                        conn.sendall(b"already signed")
                        return
                else:
                    conn.sendall(b"Join is full")
                    return
            else:
                conn.sendall(b"Message not applicable, Join in signature state")
                return
        elif self.state == JoinState.DONE:
            pass
        else:
            conn.sendall(b"in invalid state")


def start_server():
    HOST = sys.argv[1]      #ip addresses for testing:  '100.64.8.232', '192.168.128.238'
    PORT = 65432        # Port to listen on (non-privileged ports are > 1023)
    print(HOST)

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((HOST, PORT))
    s.listen()
    joins.append(JoinState("123", 15))
    REQUEST_TERMINATOR = b'\r\n\r\n'

    while True:
        #loop that continues to accept requests
        conn, addr = s.accept()        
        print('Connected by', addr)
        message = b''
        while True:
            data = conn.recv(1024)
            if data == b'':
                break

            message += data

            while message != b'' and message.find(REQUEST_TERMINATOR) != -1:
                request_length = JoinState.process_header(conn, message[:message.find(REQUEST_TERMINATOR)])
                if request_length < 0:
                    break #XXX
                message = message[message.find(REQUEST_TERMINATOR)+len(REQUEST_TERMINATOR):]
                if len(message) != request_length:
                    while (len(message) < request_length):
                        data = conn.recv(1024)
                        if data == b'':
                            break
                        message += data

                request_data = json.loads(message)
                if JoinState.isvalid_jsondata(request_data):
                    join = JoinState.find_join(request_data)
                    print(join.id)
                    join.process_request(request_data, conn, HOST)
                else:
                    print("invalid json data")
            break

start_server()