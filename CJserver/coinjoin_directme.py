from json.decoder import JSONDecodeError
from coinjoin import JoinState
from utils.httprequest import *

from assetinfo import *
from params import *
from joinstatesamples import samples
from messages import send_wiretx, send_signedtx, send_message, send_errmessage, send_option_data, send_compatable_joinlist, send_join_data, send_nonce
import socket
import sys
import json
import time


feeaddress = "X-fuji18gcr997m4cntu2pzp9u5p72pmm53d6376l6cee",
standard_fee_percent = .10

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
    print("processing headers")
    req = HTTPRequest(message)
    if not isvalid_request(req):
        return -1
    return request_length(req)

#returns the json data from a connection, or throws an error if json data is incorrect
def get_json_data(conn):
    print("getting json data")
    message = b''
    while True:
        data = conn.recv(1024)
        if data == b'':
            return message

        message += data

        while message != b'' and message.find(REQUEST_TERMINATOR) != -1:
            request_length = process_header(message[:message.find(REQUEST_TERMINATOR)])
            if request_length < 0:
                return b''
            message = message[message.find(REQUEST_TERMINATOR) + len(REQUEST_TERMINATOR):]
            if len(message) < request_length:
                while (len(message)< request_length):
                    data = conn.recv(1024)
                    if data == b'':
                        return b''
                    message += data
            if message == b'':
                return message
            try:
                return json.loads(message)
            except JSONDecodeError:
                return b''

#Creates a new join if no joins are available
def create_new_join(asset_type, amount, networkID, limit):
    new_join = JoinState(
        connect_limit = limit,
        assetID = asset_type,
        networkID = networkID,
        assetamount = amount,
        feepercent = standard_fee_percent,
        feeaddress = feeaddress
    )
    return new_join

#Returns a list of joins that match the users specificaitons
def find_joins(assetID, amount, networkID, min_users, max_users):
    matches = []

    for item in joinlist:
        item = joinlist[item]
        
        if item.state == COLLECT_INPUTS and item.assetID == assetID and item.assetamount == amount \
        and item.connect_limit >= min_users and item.connect_limit <= max_users and item.networkID == networkID:
            matches.append(item.get_status())
    if len(matches) == 0:
        print("no joins found, creating new join")
        #If no join is found, create a new one
        new_join = create_new_join(assetID, amount, networkID, min_users)
        joinlist[new_join.id] = new_join
        matches.append(new_join.get_status())
    return matches

#Determines what the option data for a find_joins request is.  
def parse_option_data(data):
    assetID = data["assetID"]
    assetID = convert_to_asset_id(assetID)
    networkID = data["networkID"]
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
    return [assetID, assetamount, networkID, min_users, max_users]

#Determines if the given jsondata is valid
def isvalid_jsondata(data):
    if data == b'':
        print("invalid data")
        return False
    if not "messagetype" in data:
        print("no messagetype")
        return False
    if data["messagetype"] == START_PROCESS: 
        return True
    if "joinid" in data and data["joinid"] not in joinlist:
        return False

    elif data["messagetype"] == SELECT_OPTIONS: 
        #checks if the select options data has all of the necessary information required
        if not "assetamount" in data or not "assetID" in data or not "networkID" in data or not \
            (data["assetID"] in ASSET_NAMES or data["assetID"] in ASSET_IDS):
            print("insufficient data for selectoptions message")
            return False
        assetID = convert_to_asset_id(data["assetID"])

        # checks if the select options data is compatible with the parameters for the cj server
        if data["networkID"] not in [1, 5] or data["assetamount"] not in ASSET_DENOMS[ASSET_IDS.index(assetID)]:
            print("request data is incompatible with parameters for the cj server")
            return False

    elif data["messagetype"] == GET_JOIN_DATA:  
        if not "joinid" in data:
            print("no joinid in data for selectjoin message")
            return False
    elif data["messagetype"] == REQUEST_NONCE:
        if not "joinid" in data or not "pubaddr" in data:
            print("insufficient information to request nonce")
    elif data["messagetype"] == COLLECT_INPUTS:
        if not "joinid" in data or not "pubaddr" in data or not "inputbuf" in data or not "outputbuf" in data or not "ticket" in data:
            print("insufficient data for input message")
            return False
    elif data["messagetype"] == COLLECT_SIGS:
        if not "joinid" in data or not "signature" in data or not "pubaddr" in data:
            print("insufficient data for signature message")
            return False
    elif data["messagetype"] == ISSUE_TX:
        if not "joinid" in data:
            print("insufficient data for issue_tx message")
            return False
    elif data["messagetype"] == REQUEST_WTX:
        if not "joinid" in data or not "pubaddr" in data:
            print("cannot send back wiretx")
            return False
    elif data["messagetype"] == EXIT:
        if not "joinid" in data or not "pubaddr" in data or not "ticket" in data:
            print("insufficient data to exit CJ")
            return False
    else:
        return False
    print("good data")
    return True

def get_join(data):
    if data["joinid"] in joinlist:
        return joinlist[data["joinid"]]
    return None

def get_messagetype(data):
    return data["messagetype"]

def generate_option_data():
    returndata = {}
    for item in ASSET_TYPES:
        returndata[item[0]] = (item[1], item[2])
    return returndata

#Processes data based on what kind of message the data contains
def process_data(conn, addr):
    global joinlist
    data = get_json_data(conn)
    if isvalid_jsondata(data):
        messagetype = get_messagetype(data)
        if messagetype == START_PROCESS:
            print("displaying options to user")
            option_data = generate_option_data()
            send_option_data(conn, option_data)
        elif messagetype == SELECT_OPTIONS:
            print("sending compatible coinjoins")
            specs = parse_option_data(data)
            matches = find_joins(specs[0], specs[1], specs[2], specs[3], specs[4])
            send_compatable_joinlist(conn, matches)
        elif messagetype == GET_JOIN_DATA:
            join = get_join(data)
            if join != None:
                print("sending info for join of id %s" % join.get_status())
                send_join_data(conn, join.get_status())
            else:
                print("tried to request information for join that doesn't exist")
                send_errmessage(conn, "Join does not exist for id %d" % data["joinid"])
        elif messagetype == REQUEST_NONCE:
            join = get_join(data)
            print("sending nonce to address")
            join.process_request(data, conn, addr)
        elif messagetype == COLLECT_INPUTS: 
            join = get_join(data)
            print("collecting input for join of id %s" % join)
            join.process_request(data, conn, addr)
        elif messagetype == COLLECT_SIGS:
            join = get_join(data)
            print("collecting signature for join of id %s" % join)
            join.process_request(data, conn, addr)
        elif messagetype == ISSUE_TX:
            join = get_join(data)
            print("issuing transaction for join of id %s" % join)
            join.process_request(data, conn, addr)
        elif messagetype == REQUEST_WTX:
            join = get_join(data)
            print("sending wiretx to participant")
            join.process_request(data, conn, addr)
        elif messagetype == EXIT:
            join = get_join(data)
            print("starting exit process")
            join.process_request(data, conn, addr)
        else:
            send_errmessage(conn, "not a valid messagetype")
    else:
        print("invalid data")
        send_errmessage(conn, "invalid or insufficient data for message")

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