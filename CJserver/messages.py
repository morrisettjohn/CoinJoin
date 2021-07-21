import socket

req_terminator = "\r\n\r\n"

def send_message(conn, message):
    conn.sendall(str.encode("MSG" + message + req_terminator))

def send_errmessage(conn, message):
    conn.sendall(str.encode("ERR" + message + req_terminator))
    conn.close()

def send_option_data(conn, optiondata):
    conn.sendall(str.encode("OPT" + optiondata + req_terminator))
    conn.close()

def send_compatable_joinlist(conn, matches):
    conn.sendall(str.encode("JLS" + matches + req_terminator))
    conn.close()

def send_join_data(conn, joindata):
    conn.sendall(str.encode("JDT" + joindata + req_terminator))
    conn.close()

def send_wiretx(conn, wiretx):
    conn.sendall(str.encode("WTX" + wiretx + req_terminator))
    conn.close()

def send_signedtx(conn, signedtx):
    conn.sendall(str.encode("STX" + signedtx + req_terminator))
    conn.close()

def send_nonce(conn, nonce):
    conn.sendall(str.encode("NCE" + nonce + req_terminator))