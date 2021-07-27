import socket
import json

req_terminator = "\r\n\r\n"

def send_message(conn, message):
    conn.sendall(str.encode("MSG" + message + req_terminator))

def send_errmessage(conn, message):
    conn.sendall(str.encode("ERR" + message + req_terminator))
    conn.close()

def send_option_data(conn, optiondata):
    conn.sendall(str.encode("OPT" + json.dumps(optiondata) + req_terminator))
    conn.close()

def send_compatable_joinlist(conn, matches):
    conn.sendall(str.encode("JLS" + json.dumps(matches) + req_terminator))
    conn.close()

def send_join_data(conn, joindata):
    conn.sendall(str.encode("JDT" + json.dumps(joindata) + req_terminator))
    conn.close()

def send_wiretx(conn, wiretx):
    conn.sendall(str.encode("WTX" + json.dumps(wiretx) + req_terminator))

def send_signedtx(conn, signedtx):
    conn.sendall(str.encode("STX" + json.dumps(signedtx) + req_terminator))

def send_nonce(conn, nonce):
    conn.sendall(str.encode("NCE" + nonce + req_terminator))

def send_accepted_txid(conn, txid):
    conn.sendall(str.encode("TXD" + txid + req_terminator))