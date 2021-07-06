import socket

def send_message(conn, message):
    conn.sendall(str.encode("MSG" + message + "\r\n\r\n"))

def send_errmessage(conn, message):
    conn.sendall(str.encode("ERR" + message + "\r\n\r\n"))
    conn.close()

def send_option_data(conn, optiondata):
    conn.sendall(str.encode("OPT" + optiondata + "\r\n\r\n"))
    conn.close()

def send_compatable_joinlist(conn, matches):
    conn.sendall(str.encode("JLS" + matches + "\r\n\r\n"))
    conn.close()

def send_join_data(conn, joindata):
    conn.sendall(str.encode("JDT" + joindata + "\r\n\r\n"))
    conn.close()

def send_wiretx(conn, wiretx):
    conn.sendall(str.encode("WTX" + wiretx + "\r\n\r\n"))
    conn.close()

def send_signedtx(conn, signedtx):
    conn.sendall(str.encode("STX" + signedtx + "\r\n\r\n"))
    conn.close()

