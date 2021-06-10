from CoinJoin import JoinState
from HTTPRequest import *
from params import *
from JoinState_samples import samples
import socket
import requests

import sys
import json

current_id = 0
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

def create_new_join(asset_type, amount):
    global current_id
    new_join = JoinState(
        id = current_id,
        connect_limit = 7,
        assettype = asset_type,
        assetamount = amount,
    )
    current_id += 1
    return new_join

def find_joins(assettype, amount):
    matches = []
    for item in joinlist:
        item = joinlist[item]
        if item.state == COLLECT_INPUTS and item.assettype == assettype and item.assetamount == amount:
            matches.append(item.get_status())
    if len(matches) == 0:
        #If no join is found, create a new one
        new_join = create_new_join(assettype, amount)
        joinlist[new_join.id] = new_join
        matches.append(new_join.get_status())
    return matches

def get_json_data(conn):
    message = b''
    while True:
        data = conn.recv(1024)
        if data == b'':
            break

        message += data

        while message != b'' and message.find(REQUEST_TERMINATOR) != -1:
            request_length = process_header(message[:message.find(REQUEST_TERMINATOR)])
            if request_length < 0:
                break
            message = message[message.find(REQUEST_TERMINATOR) + len(REQUEST_TERMINATOR):]
            if len(message) < request_length:
                data = conn.recv(1024)
                if data == b'':
                    break
                message += data
            return json.loads(message)

def parse_option_data(data):
    assettype = data["assettype"]
    assetamount = data["assetamount"]
    if assettype in ASSET_TYPES and assetamount in JOIN_AMOUNTS:
        return [assettype, assetamount]
    #XXX error handling

def parse_join_data(data):
    joinid = data["joinid"]
    return joinid
    #XXX error handling

def get_join(data):
    return joinlist[data["joinid"]]

def isvalid_jsondata(data):
    if not "messagetype" in data:
        return False
    if data["messagetype"] == "startprocess":
        return True
    elif data["messagetype"] == "selectoptions":
        if not "assetamount" in data or not "assettype" in data:
            return False
    elif data["messagetype"] == "selectjoin":
        if not "joinid" in data:
            return False
    elif data["messagetype"] == "input":
        if not "joinid" in data or not "utxo" in data or not "utxooffset" in data or not "assetamount" in data or not "assettype" in data or not "destinationaddr" in data:
            return False
    elif data["messagetype"] == "signature":
        if not "joinid" in data or not "signature" in data:
            return False
    else:
        return False
    return True

def get_messagetype(data):
    return data["messagetype"]

def process_data(conn, HOST):
    global joinlist
    data = get_json_data(conn)
    if isvalid_jsondata(data):
        messagetype = get_messagetype(data)
        if messagetype == "startprocess":
            conn.sendall(str.encode(json.dumps({"message": "select options", "currencies": ASSET_TYPES, "amounts": JOIN_AMOUNTS})))
        elif messagetype == "selectoptions":
            option_data = parse_option_data(data)
            assettype = option_data[0]
            amount = option_data[1]
            matches = find_joins(assettype, amount)
            conn.sendall(str.encode(json.dumps({"message": "select a join", "joins": matches})))
        elif messagetype == "selectjoin":
            join = get_join(data)
            conn.sendall(str.encode(json.dumps({"message": "input transaction data", "join_data": join.get_status()})))
        elif messagetype == "input":
            join = get_join(data)
            join.process_request(data, conn, HOST)
        elif messagetype == "signature":
            join = get_join(data)
            join.process_request(data, conn, HOST)
        else:
            return Exception("uh oh")

def start_findme_service():
    HOST = sys.argv[1][:sys.argv[1].find(":")]
    PORT = int(sys.argv[1][sys.argv[1].find(":")+1:])
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((HOST, PORT))
    s.listen()

    while True:
        conn, addr = s.accept()
        conn.sendall(b"HTTP/1.1 200 OK\r\n\r\n")   #initializes http response
        print("Connected by", addr)
        process_data(conn, addr)
        conn.close()
                

joinlist = samples
start_findme_service()