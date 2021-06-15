from json.decoder import JSONDecodeError
from CoinJoin import JoinState
from HTTPRequest import *

from params import *
from JoinState_samples import samples
import socket
import sys
import json
import time

current_id = 7
joinlist = {}

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

def request_length(req):
    return int(req.headers['Content-Length'])

def process_header(message):
    req = HTTPRequest(message)
    if not isvalid_request(req):
        return -1
    return request_length(req)

#returns the json data from a connection, or throws an error if json data is incorrect
def get_json_data(conn):
    message = b''
    while True:
        data = conn.recv(1024)
        if data == b'':
            return message

        message += data

        while message != b'' and message.find(REQUEST_TERMINATOR) != -1:
            request_length = process_header(message[:message.find(REQUEST_TERMINATOR)])
            if request_length < 0:
                break
            message = message[message.find(REQUEST_TERMINATOR) + len(REQUEST_TERMINATOR):]
            if len(message) < request_length:
                while (len(message)< request_length):
                    data = conn.recv(1024)
                    if data == b'':
                        break
                    message += data
            if message == b'':
                return message
            try:
                return json.loads(message)
            except JSONDecodeError:
                return b''

#Creates a new join if no joins are available
def create_new_join(asset_type, amount, limit):
    global current_id
    new_join = JoinState(
        id = current_id,
        connect_limit = limit,
        assettype = asset_type,
        assetamount = amount,
    )
    current_id += 1
    return new_join

#Returns a list of joins that match the users specificaitons
def find_joins(assettype, amount, min_users, max_users):
    global current_id
    matches = []
    for item in joinlist:
        item = joinlist[item]
        
        if item.state == COLLECT_INPUTS and item.assettype == assettype and item.assetamount == amount \
        and item.connect_limit >= min_users and item.connect_limit <= max_users:
            matches.append(item.get_status())
    if len(matches) == 0:
        print("no joins found, creating new join")
        #If no join is found, create a new one
        new_join = create_new_join(assettype, amount, min_users)
        joinlist[new_join.id] = new_join
        matches.append(new_join.get_status())
        print(joinlist)
        current_id += 1
    return matches

#Determines what the option data for a find_joins request is.  
def parse_option_data(data):
    assettype = data["assettype"]
    assetamount = data["assetamount"]
    min_users = DEFAULT_LOWER_USER_BOUND
    max_users = DEFAULT_UPPER_USER_BOUND
    if "min_users" in data:
        min_users = int(data["min_users"])  
    if "max_users" in data:
        max_users = int(data["max_users"])

    #handling incorrect inputs of min/max user bounds
    if min_users < MIN_USER_BOUND or min_users > MAX_USER_BOUND:
        print("minimum bound invalid, correcting")
        min_users = DEFAULT_LOWER_USER_BOUND
    if max_users < MIN_USER_BOUND or max_users > MAX_USER_BOUND:
        print("upper bound invalid, correcting")
        max_users = DEFAULT_UPPER_USER_BOUND
    if min_users > max_users:
        print("lower bound greater than upper bound, setting both to %d" % max_users)
        min_users = max_users
    return [assettype, assetamount, min_users, max_users]

#Determines if the given jsondata is valid
def isvalid_jsondata(data):
    if data == b'':
        print("no messagetype")
        return False
    if not "messagetype" in data:
        print("no messagetype")
        return False
    if data["messagetype"] == START_PROCESS: 
        return True
    elif data["messagetype"] == SELECT_OPTIONS:    
        if not "assetamount" in data or not "assettype" in data or not data["assettype"] in ASSET_TYPES:
            print("insufficient data for selectoptions message")
            return False
    elif data["messagetype"] == SELECT_JOINS:  
        if not "joinid" in data:
            print("no joinid in data for selectjoin message")
            return False
    elif data["messagetype"] == COLLECT_INPUTS:
        if not "joinid" in data or not "utxo" in data or not "utxooffset" in data or not "assetamount" in data\
             or not "assettype" in data or not "destinationaddr" in data or not "pubaddr" in data:
            print("insufficient data for input message")
            return False
    elif data["messagetype"] == COLLECT_SIGS:
        if not "joinid" in data or not "signature" in data or not "pubaddr" in data:
            print("insufficient data for signature message")
            return False
    else:
        return False
    print("good data")
    return True

def get_join(data):
    return joinlist[data["joinid"]]

def get_messagetype(data):
    return data["messagetype"]

#Processes data based on what kind of message the data contains
def process_data(conn, addr):
    global joinlist
    data = get_json_data(conn)
    if isvalid_jsondata(data):
        messagetype = get_messagetype(data)
        if messagetype == START_PROCESS:
            conn.sendall(str.encode(json.dumps({"message": "select options", "currencies": ASSET_TYPES, "amounts": JOIN_AMOUNTS})))
            conn.close()
        elif messagetype == SELECT_OPTIONS:
            specs = parse_option_data(data)
            matches = find_joins(specs[0], specs[1], specs[2], specs[3])
            conn.sendall(str.encode(json.dumps({"message": "select a join", "joins": matches})))
            conn.close()
        elif messagetype == SELECT_JOINS:
            join = get_join(data)
            conn.sendall(str.encode(json.dumps({"message": "input transaction data", "join_data": join.get_status()})))
            conn.close()
        elif messagetype == COLLECT_INPUTS:
            join = get_join(data)
            join.process_request(data, conn, addr)
        elif messagetype == COLLECT_SIGS:
            join = get_join(data)
            join.process_request(data, conn, addr)
        else:
            conn.sendall(b"not a valid messagetype")
            conn.close()
    else:
        print("invalid data")
        conn.sendall(b"invalid or insufficient data for message")
        conn.close()

#Starts the whole coinjoin process, starting from beginning to end
def start_findme_service():
    HOST = sys.argv[1][:sys.argv[1].find(":")]
    PORT = int(sys.argv[1][sys.argv[1].find(":")+1:])
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)   #XXX just doing this for testing purposes, can be deleted later
    s.bind((HOST, PORT))
    s.listen()

    while True:
        conn, addr = s.accept()
        conn.sendall(b"HTTP/1.1 200 OK\r\n\r\n")   #initializes http response
        print("Connected by", addr)
        process_data(conn, addr)

joinlist = samples
start_findme_service()