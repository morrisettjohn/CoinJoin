from .CoinJoin_server import *
from .HTTPRequest import HTTPRequest
import socket

joins = []
JOIN_LIMIT = 10
COLLECT_INPUTS, COLLECT_SIGS, DONE = range(3)

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
    if not JoinState.isvalid_request(req):
        return -1
    return JoinState.request_length(req)

def find_joins(request_data, conn):
    matches = []
    for item in joins:
        if item.state == COLLECT_INPUTS and item.assettype == request_data["assettype"] and item.assetamount == request_data["amount"]:
            matches.append(item)
    

def start_findme_service():
    HOST = sys.argv[1]
    PORT = 12345
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
                