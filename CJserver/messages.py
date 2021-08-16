import socket
import json

req_terminator = "\r\n\r\n"

def send_message(conn, message):
    data = str.encode("MSG" + message + req_terminator)
    send(conn, data)

def send_err(conn, message):
    data = str.encode("ERR" + message + req_terminator)
    send(conn, data)
    conn.close()

def send_option_data(conn, option_data):
    data = str.encode("OPT" + json.dumps(option_data) + req_terminator)
    send(conn, data)
    conn.close()

def send_compatable_join_list(conn, matches):
    data = str.encode("JLS" + json.dumps(matches) + req_terminator)
    send(conn, data)
    conn.close()

def send_join_data(conn, join_data):
    data = str.encode("JDT" + json.dumps(join_data) + req_terminator)
    send(conn, data)
    conn.close()

def send_wtx(conn, wtx):
    data = str.encode("WTX" + json.dumps(wtx) + req_terminator)
    send(conn, data)

def send_stx(conn, stx):
    data = str.encode("STX" + json.dumps(stx) + req_terminator)
    send(conn, data)

def send_nonce(conn, nonce_verification_data):
    data = str.encode("NCE" + json.dumps(nonce_verification_data) + req_terminator)
    send(conn, data)

def send_accepted_tx_ID(conn, tx_ID):
    data = str.encode("TXD" + tx_ID + req_terminator)
    send(conn, data)
    

def send(conn, data):
    try:
        conn.sendall(data)
    except Exception:
        pass