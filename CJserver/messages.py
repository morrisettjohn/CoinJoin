# file that contains methods for sending data types of messages to a client

import json

req_terminator = "\r\n\r\n"

#sends a general message to the client.  No real information provided
def send_message(conn, message):
    data = str.encode("MSG" + message + req_terminator)
    send(conn, data)

#sends an error message to the client in case something goes wrong during a join tx.
def send_err(conn, message):
    data = str.encode("ERR" + message + req_terminator)
    send(conn, data)
    conn.close()

#sends the server's specified option data for assets
def send_option_data(conn, option_data):
    data = str.encode("OPT" + json.dumps(option_data) + req_terminator)
    send(conn, data)
    conn.close()

#sends all the joins that match the specifications the user sends over to the server
def send_compatable_join_list(conn, matches):
    data = str.encode("JLS" + json.dumps(matches) + req_terminator)
    send(conn, data)
    conn.close()

#sends over the information on a specific join
def send_join_data(conn, join_data):
    data = str.encode("JDT" + json.dumps(join_data) + req_terminator)
    send(conn, data)
    conn.close()

#sends over the join's wtx data
def send_wtx(conn, wtx):
    data = str.encode("WTX" + json.dumps(wtx) + req_terminator)
    send(conn, data)

#sends over the join's signed transaction data
def send_stx(conn, stx):
    data = str.encode("STX" + json.dumps(stx) + req_terminator)
    send(conn, data)

#sends nonce verification data
def send_nonce(conn, nonce_verification_data):
    data = str.encode("NCE" + json.dumps(nonce_verification_data) + req_terminator)
    send(conn, data)

#sends over the accepted tx_ID for a completed join tx
def send_accepted_tx_ID(conn, tx_ID):
    data = str.encode("TXD" + tx_ID + req_terminator)
    send(conn, data)

def send_log_confirmation(conn):
    data = str.encode("LOG" + "T" + req_terminator)
    send(conn, data)
    
#standard way to send over data
def send(conn, data):
    try:
        conn.sendall(data)
    except Exception:
        pass