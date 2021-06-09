import os
from HTTPRequest import *
from CoinJoin_server import *
from params import *
import sys
import socket
import json

joins = []
JOIN_DISPLAY_LIMIT = 10
JOINS_NUMBER = 15
current_id = 0

def isvalid_json():
    return True

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

def process_header(conn, message):
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

def find_joins(request_data, conn):
    #XXX create available joins if you need to,
    #XXX fixed amounts, make sure matchmaking is easy 1, 10, 100 avax
    matches = []
    for item in joins:
        if item.state == COLLECT_INPUTS and item.assettype == request_data["assettype"] and item.assetamount == request_data["amount"]:
            matches.append(json.loads(str({"id": item.name})))
        if matches >= JOIN_DISPLAY_LIMIT:
            break
    if len(matches) == 0:
        joins.append(create_new_join(request_data["assettype"], request_data["amount"]))
    return matches
    
def start_findme_service():
    HOST = sys.argv[1][:sys.argv[1].find(":")]
    PORT = sys.argv[1][sys.argv[1].find(":"):]
    REQUEST_TERMINATOR = b'\r\n\r\n'
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((HOST, PORT))
    s.listen()

    while True:
        conn, addr = s.accept()
        print("Connected by", addr)
        message = b''
        while True:
            data = conn.recv(1024)
            if data == b'':
                break

            message += data

            request_done = False
            while message != b'' and message.find(REQUEST_TERMINATOR) != -1:
                request_length = process_header(conn, message[:message.find(REQUEST_TERMINATOR)])
                if request_length < 0:
                    break
                message = message[message.find(REQUEST_TERMINATOR) + len(REQUEST_TERMINATOR):]
                if len(message) < request_length:
                    data = conn.recv(1024)
                    if data == b'':
                        break
                    message += data

                request_data = json.loads(message)
                if isvalid_json(request_data):
                    find_joins(request_data)
                else:
                    print("invalid json data")
            if request_done:
                break
                
start_findme_service()