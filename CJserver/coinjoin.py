#File that runs the coinjoin server

from json.decoder import JSONDecodeError
from joinstate import JoinState
from utils.httprequest import *

from assetinfo import *
from params import *
from joinstatesamples import generate_samples
from messages import send_err, send_option_data, send_compatable_join_list, send_join_data
import socket
import sys
import json
from config import *


fee_address = FEE_KEY
standard_fee_percent = STANDARD_FEE_PERCENT
join_list = {}

#determines if the request headers are valid
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

#returns the length of the request
def request_length(req):
    return int(req.headers['Content-Length'])

#processes the headers for a message
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
def create_new_join(asset_type, amount, network_ID, limit):
    new_join = JoinState(
        threshold = limit,
        asset_ID = asset_type,
        network_ID = network_ID,
        out_amount = amount,
        fee_percent = standard_fee_percent,
    )
    return new_join

#Returns a list of joins that match the users specificaitons
def find_joins(asset_ID, amount, network_ID, min_users, max_users):
    global join_list
    matches = []

    for item in join_list:
        item = join_list[item]
        
        if item.state == COLLECT_INPUTS and item.asset_ID == asset_ID and item.out_amount == amount \
        and item.threshold >= min_users and item.threshold <= max_users and item.network_ID == network_ID:
            matches.append(item.get_status())
    if len(matches) == 0:
        print("no joins found, creating new join")
        #If no join is found, create a new one
        new_join = create_new_join(asset_ID, amount, network_ID, min_users)
        join_list[new_join.ID] = new_join
        matches.append(new_join.get_status())
    return matches

#Determines what the option data for a find_joins request is.  
def parse_option_data(data):
    asset_ID = data["asset_ID"]
    asset_ID = convert_to_asset_id(asset_ID)
    network_ID = data["network_ID"]
    asset_amount = data["asset_amount"]
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
    return [asset_ID, asset_amount, network_ID, min_users, max_users]

#Determines if the given jsondata is valid
def is_valid_json_data(data):
    if data == b'':
        print("invalid data")
        return False
    if not "message_type" in data:
        print("no message type")
        return False
    if data["message_type"] == START_PROCESS: 
        return True

    elif data["message_type"] == SELECT_OPTIONS: 
        #checks if the select options data has all of the necessary information required
        if not "asset_amount" in data or not "asset_ID" in data or not "network_ID" in data or not \
            (data["asset_ID"] in ASSET_NAMES or data["asset_ID"] in ASSET_IDS):
            print("insufficient data for selectoptions message")
            return False
        asset_ID = convert_to_asset_id(data["asset_ID"])

        # checks if the select options data is compatible with the parameters for the cj server
        if data["network_ID"] not in [1, 5] or data["asset_amount"] not in ASSET_DENOMS[ASSET_IDS.index(asset_ID)]:
            print("request data is incompatible with parameters for the cj server")
            return False

    elif data["message_type"] == GET_JOIN_DATA:  
        if not "join_ID" in data:
            print("no join_ID in data for selectjoin message")
            return False
    elif data["message_type"] == REQUEST_NONCE:
        if not "join_ID" in data or not "pub_addr" in data or not "server_nonce" in data:
            print("insufficient information to request nonce")
    elif data["message_type"] == COLLECT_INPUTS:
        if not "join_ID" in data or not "pub_addr" in data or not "input_buf" in data or not "output_buf" in data\
            or not "nonce" in data or not "nonce_sig" in data:
            print("insufficient data for input message")
            return False
    elif data["message_type"] == COLLECT_SIGS:
        if not "join_ID" in data or not "sig" in data or not "pub_addr" in data:
            print("insufficient data for signature message")
            return False
    elif data["message_type"] == ISSUE_TX:
        if not "join_ID" in data:
            print("insufficient data for issue_tx message")
            return False
    elif data["message_type"] == REQUEST_WTX:
        if not "join_ID" in data or not "pub_addr" in data or not "nonce" in data or not "nonce_sig" in data:
            print("cannot send back wiretx")
            return False
    elif data["message_type"] == EXIT:
        if not "join_ID" in data or not "pub_addr" in data or not "nonce" in data or not "nonce_sig" in data:
            print("insufficient data to exit CJ")
            return False
    else:
        return False
    print("good data")
    return True

#returns a join instance based on the join id
def get_join(data):
    if data["join_ID"] in join_list:
        return join_list[data["join_ID"]]
    return None

def extract_message_type(data):
    return data["message_type"]

def generate_option_data():
    return_data = {}
    for item in ASSET_TYPES:
        return_data[item[0]] = (item[1], item[2])
    return return_data

#Processes data based on what kind of message the data contains
def process_data(conn, addr, network):
    global join_list

    try:
        data = get_json_data(conn)
    except Exception:
        print("data transfer was not completed")
        return

    if is_valid_json_data(data):
        if "join_ID" in data and data["join_ID"] not in join_list:
            send_err(conn, "no such join exists")
            return

        message_type = extract_message_type(data)
        if message_type == START_PROCESS:
            print("displaying options to user")
            option_data = generate_option_data()
            send_option_data(conn, option_data)
        elif message_type == SELECT_OPTIONS:
            print("sending compatible coinjoins")
            
            if data["network_ID"] != network:
                send_err(conn, "join server is on network %s, not network %s" % (network, data["network_ID"]))
            else:
                specs = parse_option_data(data)
                matches = find_joins(specs[0], specs[1], specs[2], specs[3], specs[4])
                send_compatable_join_list(conn, matches)
        elif message_type == GET_JOIN_DATA:
            join = get_join(data)
            if join != None:
                print("sending info for join of id %s" % join.ID)
                send_join_data(conn, join.get_status())
            else:
                print("tried to request information for join that doesn't exist")
                send_err(conn, "Join does not exist for id %d" % data["join_ID"])
        elif message_type == REQUEST_NONCE:
            join = get_join(data)
            print("sending nonce to address")
            join.process_request(data, conn, addr)
        elif message_type == COLLECT_INPUTS: 
            join = get_join(data)
            print("collecting input for join of id %s" % join.ID)
            join.process_request(data, conn, addr)
        elif message_type == COLLECT_SIGS:
            join = get_join(data)
            print("collecting signature for join of id %s" % join.ID)
            join.process_request(data, conn, addr)
        elif message_type == ISSUE_TX:
            join = get_join(data)
            print("issuing transaction for join of id %s" % join.ID)
            join.process_request(data, conn, addr)
        elif message_type == REQUEST_WTX:
            join = get_join(data)
            print("sending wiretx to participant")
            join.process_request(data, conn, addr)
        elif message_type == EXIT:
            join = get_join(data)
            print("starting exit process")
            join.process_request(data, conn, addr)
        else:
            send_err(conn, "not a valid message_type")
    else:
        print("invalid data")
        send_err(conn, "invalid or insufficient data for message")

#Starts the whole coinjoin process, starting from beginning to end
def start_server():
    global join_list

    if sys.argv[1].lower() == "info" or sys.argv[1].lower() == "help":
        print("Description:  Starts the coinjoin server.  Need to specify the network that the server will operate on")
        print("Usage: python3 coinjoin.py (ip:port) network_ID")

    HOST = sys.argv[1][:sys.argv[1].find(":")]
    PORT = int(sys.argv[1][sys.argv[1].find(":")+1:])
    network = int(sys.argv[2])
    join_list = generate_samples(network)

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)   #XXX just doing this for testing purposes, can be deleted later
    s.bind((HOST, PORT))
    s.listen()

    while True:
        conn, addr = s.accept()
        conn.sendall(b"HTTP/1.1 200 OK\r\n\r\n")   #initializes http response
        print("Connected by", addr)
        process_data(conn, addr, network)

start_server()