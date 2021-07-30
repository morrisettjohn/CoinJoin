import socket
import json

req_terminator = "\r\n\r\n"

def send_message(conn, message):
    data = str.encode("MSG" + message + req_terminator)
    send(conn, data)

def send_errmessage(conn, message):
    data = str.encode("ERR" + message + req_terminator)
    send(conn, data)
    conn.close()

def send_option_data(conn, optiondata):
    data = str.encode("OPT" + json.dumps(optiondata) + req_terminator)
    send(conn, data)
    conn.close()

def send_compatable_joinlist(conn, matches):
    data = str.encode("JLS" + json.dumps(matches) + req_terminator)
    send(conn, data)
    conn.close()

def send_join_data(conn, joindata):
    data = str.encode("JDT" + json.dumps(joindata) + req_terminator)
    send(conn, data)
    conn.close()

def send_wiretx(conn, wiretx):
    data = str.encode("WTX" + json.dumps(wiretx) + req_terminator)
    send(conn, data)

def send_signedtx(conn, signedtx):
    data = str.encode("STX" + json.dumps(signedtx) + req_terminator)
    send(conn, data)

def send_nonce(conn, nonce):
    data = str.encode("NCE" + nonce + req_terminator)
    send(conn, data)

def send_accepted_txid(conn, txid):
    data = str.encode("TXD" + txid + req_terminator)
    send(conn, data)
    

def send(conn, data):
    try:
        conn.sendall(data)
    except Exception:
        pass