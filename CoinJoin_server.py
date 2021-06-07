import socket
from http.server import BaseHTTPRequestHandler
from io import BytesIO

import json
import sys

#import wallet
#from avatools.inputs import MultisigInput
#from avatools.outputs import MultisigOutput, Utxo
#from avatools.transaction import TransactionWithState

joins = []

#Parses raw http header data
class HTTPRequest(BaseHTTPRequestHandler):
    def __init__(self, request_text):
        self.rfile = BytesIO(request_text)
        self.raw_requestline = self.rfile.readline()
        self.error_code = self.error_message = None
        self.parse_request()

    def send_error(self, code, message):
        self.error_code = code
        self.error_message = message   

#Class which holds all the coinjoin data
class JoinState:
    COLLECT_INPUTS, COLLECT_SIGS, DONE = range(3)

    def __init__(self, name = "test", connect_limit = 3, assettype = 1, assetamount = 10, 
            feeaddress = "", feeamount = 0):
        if feeamount < 0:
            return Exception("fee must be 0 or positive")

        self.name = name
        self.connect_limit = connect_limit
        self.assettype = assettype
        self.assetamount = assetamount
        self.feeaddress = feeaddress
        self.feeamount = feeamount
        self.state = JoinState.COLLECT_INPUTS
        self.IP_addresses = []
        self.connections = []
        self.signers = []
        self.inputs = []
        self.outputs = []

    def find_join(request_data):
        joinid = request_data["joinid"]
        for join in joins:
            if join.name == joinid:
                return join
        return None

    def take_inputdata(data):
        return data[0]["utxo"]

    def create_input(request_data, conn):
        return [MultisigInput(
            request_data["utxo"],
            request_data["utxooffset"],
            request_data["assettype"],
            request_data["amount"],
            10,
        ), conn]

    def create_output(self, destinationaddr, amount, conn):
        return [MultisigOutput(
            amount,
            10,
            self.assettype,
            threshold=1,
            addresses= destinationaddr,
        ), conn]

    def sort_inputs(self):
        for item in self.inputs:
            item.append(int(bin(int(item[0]["utxo"], 16))[2:]))
        self.inputs = sorted(self.inputs, key=lambda x:x[2])
        for item in input:
            item.pop()

    def sort_outputs(self):
        self.outputs.sort()

    def inputs_append(self, request_data, ip):  #XXX maybe change this from host ip to public key?
        input = JoinState.create_input(request_data, ip)
        self.inputs.append(input)
        JoinState.sort_inputs()

    def outputs_append(self, destination_addr, amount, ip): #XXX maybe change this form host ip to public key?
        output = JoinState.create_output(destination_addr, amount, ip)
        self.outputs.append(output)
        JoinState.sort_outputs()

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
        return TransactionWithState(
            self.extract_inputs(), 
            self.extract_outputs(),
            None)

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
        return 15

    def process_request(self, request_data, conn, HOST):
        if self.state == JoinState.COLLECT_INPUTS:
            if request_data["messagetype"] == "input":
                if request_data["assetamount"] == self.assetamount:
                    if request_data["assettype"] == self.assettype:
                        utxo_amount = JoinState.get_utxo_amount(request_data["utxo"], request_data["utxooffset"])
                        if utxo_amount >= self.assetamount + self.feeamount:
                            if not HOST in self.IP_addresses:
                                if conn not in self.connections:
                                    self.connections.append(conn)
                                    self.IP_addresses.append(HOST)
                                    self.inputs_append(request_data, HOST)
                                    self.outputs_append(request_data["destinationaddr"], self.assetamount, HOST)

                                    #If there is a fee, add this to the outputs list
                                    if self.feeamount > 0:
                                        self.outputs_append(self.feeaddress, self.feeamount, HOST)

                                    #If the input is greater than the amount requirement and fee requirement, return that value
                                    if utxo_amount > self.assetamount + self.feeamount:
                                        self.outputs_append(senderaddress, request_data["assetamount"] - self.assetamount - self.feeamount, HOST)
                                    
                                    if len(self.connections) >= self.connect_limit:
                                        tx = self.craft_transaction()
                                        for item in self.connections:
                                            #XXX send out actual transaction to sign
                                            item.sendall(tx)
                                        self.initialize_signers()
                                        self.state = JoinState.COLLECT_SIGS
                                    return
                            
                                else:
                                    conn.sendall(b"Already connected")
                                    return
                            else:
                                conn.sendall(b"matching ip address already in use")
                        else:
                            conn.sendall(b"Insufficient amount of currency")
                    else:
                        conn.sendall(b"Mismatched asset-type")
                        return
                else:
                    conn.sendall(b"Quantity of avax needs to be the same")
                    return
            else:
                conn.sendall(b"Message not applicable, Join in input state")
                return

        elif self.state == JoinState.COLLECT_SIGS:
            if request_data["messagetype"] != "signature":
                if conn in self.connections:
                    if conn not in self.signers:
                        #XXX put the signatures together in the same order as the inputs
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
    joins.append(JoinState("Mario", 2)) 
    joins.append(JoinState("Luigi", 3, 1))
    joins.append(JoinState("Bowser", 4, 1))
    joins.append(JoinState("123", 15))
    REQUEST_TERMINATOR = b'\r\n\r\n'

    while True:
        #loop that continues to accept requests
        conn, addr = s.accept()
        print(conn)
        
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
                    join.process_request(request_data, conn, HOST)
                else:
                    print("invalid json data")
            break

start_server()