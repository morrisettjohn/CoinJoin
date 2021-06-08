# Copright (C) 2018, Emin Gun Sirer

import sys
import os
import time
import hashlib
import random
import struct
import operator
import math
import inspect
import socket
import binascii
import base58
from time import strftime, gmtime
from datetime import datetime
from threading import Lock, Condition, Thread
from ecdsa import SigningKey, VerifyingKey, SECP256k1
from ecdsa.util import randrange_from_seed__trytryagain
cipher=SECP256k1



# displays where the offset is pointing to within a byte buffer
def stroff(s, off):
    print ("XXXXX %s <-> %s" % (binascii.hexlify(s[:off]), binascii.hexlify(s[off:])))

def strslice(s):
    print ("XYZ-> %s <-" % (binascii.hexlify(s)))

#########################################################
# Number theoretic, crypto, and encoding-related helpers

def get_nonce():
    r = random.SystemRandom()
    return r.getrandbits(64)

def get_masterseed():
    r = random.SystemRandom()
    return r.getrandbits(cipher.baselen)

# create a key from a seed string
def make_key(seed):
    secexp = randrange_from_seed__trytryagain(seed, cipher.order)
    return SigningKey.from_secret_exponent(secexp, curve=cipher)

# convert private key to a pubkey byte array
def key_to_pubkey(key):
    return key.get_verifying_key().to_string()

# convert pubkey byte array back to a pubkey
def bytes_to_pubkey(bytebuf):
    return VerifyingKey.from_string(bytebuf, curve=cipher)

# convert pubkey byte array to an address
def pubkey_to_address(pubkey):
    if 'ripemd160' not in hashlib.algorithms_available:
        raise RuntimeError('missing ripemd160 hash algorithm')
        
    sha = hashlib.sha256(pubkey).digest()
    ripe = hashlib.new('ripemd160', sha).digest()
    # compute a checksum
    checksum = hashlib.sha256(ripe).digest()[:4]
    return ripe + checksum

# derive a public address from the private key
def key_to_address(key):
    return pubkey_to_address(key.get_verifying_key().to_string())

def key_to_string(key):
    return key.to_string()

def string_to_key(keystr):
    return SigningKey.from_string(keystr, curve=cipher)

def checksum(data):
    return hashlib.sha256(data).digest()

# hash the given ranges of bytes form the underlying buffer, return digest
def sha256_ranges(buf, ranges=[]):
    h = hashlib.sha256()
    for begin, end in ranges:
        h.update(buf[begin:end])
    return h.digest()

def address_to_ui(addr: bytes):
    return base58.b58encode(bytes(addr)).decode("utf-8")

def ui_to_address(inputstr: bytes):
    return base58.b58decode(inputstr)

#########################################################
# Serialization and deserialization

def pack_short(buf, off, val):
    struct.pack_into('>H', buf, off, val)
    return 2

def unpack_short(buf, off):
    val = struct.unpack_from('>H', buf, off)[0]
    return 2, val

def pack_int(buf, off, val):
    struct.pack_into('>I', buf, off, val)
    return 4

def unpack_int(buf, off):
    val = struct.unpack_from('>I', buf, off)[0]
    return 4, val

def pack_long(buf, off, val):
    struct.pack_into('>Q', buf, off, val)
    return 8

def unpack_long(buf, off):
    val = struct.unpack_from('>Q', buf, off)[0]
    return 8, val

def pack_double(buf, off, val):
    struct.pack_into('d', buf, off, val)
    return 8

def unpack_double(buf, off):
    val = struct.unpack_from('d', buf, off)[0]
    return 8, val

HASHLEN=32
ADDRLEN=24
PUBKEYLEN=64
SIGNATURELEN=64

def pack_hash(buf, off, val):
    print("hey")
    print(type(buf))
    assert len(val) == HASHLEN, "length of hash digest is %d bytes, not %d bytes" % (len(val), HASHLEN)
    buf[off:off+HASHLEN] = val
    return HASHLEN

def unpack_hash(buf, off):
    val = buf[off:off+HASHLEN]
    return HASHLEN, val

def pack_addr(buf, off, val):
    assert len(val) == ADDRLEN, "length of addr is %d bytes, not %d bytes" % (len(val), ADDRLEN)
    buf[off:off+ADDRLEN] = val
    return ADDRLEN

def unpack_addr(buf, off):
    val = buf[off:off+ADDRLEN]
    return ADDRLEN, val

def pack_pubkey(buf, off, val):
    assert len(val) == PUBKEYLEN, "length of pubkey is %d bytes, not %d bytes" % (len(val), PUBKEYLEN)
    buf[off:off+PUBKEYLEN] = val
    return PUBKEYLEN

def unpack_pubkey(buf, off):
    val = buf[off:off+PUBKEYLEN]
    return PUBKEYLEN, val

def pack_signature(buf, off, val): 
    assert len(val) == SIGNATURELEN, "length of sig is %d bytes, not %d bytes" % (len(val), SIGNATURELEN)
    buf[off:off+SIGNATURELEN] = val
    return SIGNATURELEN

def unpack_signature(buf, off): # change to use SIGNATURE length
    val = buf[off:off+SIGNATURELEN]
    return SIGNATURELEN, val

def pack_tx(buf, off, tx):
    txsize = tx.size()
    txbytes = tx.wire_representation()
    struct.pack_into(">I%ds" % (txsize,), buf, off, txsize, txbytes)
    return 4+txsize

# because we cannot include Transaction here, this function can only return txbytes
def unpack_txbytes(buf, off):
    txlen = struct.unpack_from(">I",  buf, off)[0]
    txbytes = buf[off+4:off+4+txlen]
    return 4+txlen, txbytes

MAXSTRINGLEN=65535
def pack_str(buf, off, s):
    assert len(s) <= MAXSTRINGLEN, "trying to pack too long of a string"
    sbytes = bytes(s, 'utf-8')
    struct.pack_into(">H%ds" % (len(s),), buf, off, len(s), sbytes)
    return 2+len(s)

def unpack_str(buf, off):
    slen = struct.unpack_from(">H",  buf, off)[0]
    sbytes = buf[off+2:off+2+slen]
    return 2+slen, str(sbytes, 'utf-8')

def pack_strlist(buf, off, slist: list):
    oldoff = off
    off += pack_short(buf, off, len(slist))
    for s in slist:
        off += pack_str(buf, off, s)
    return off - oldoff

def unpack_strlist(buf, off):
    oldoff = off
    slist = []
    nlen, n = unpack_short(buf, off)
    off += nlen
    for i in range(n):
        nlen, s = unpack_str(buf, off)
        off += nlen
        slist.append(s)
    return off - oldoff, slist

# All IP addresses are 16 bytes long. IPV4 addresses are prefixed with 10 0's, 2 0xff's, and 4 bytes of address. IPV6 addresses are 16 bytes long.
ipv4prefix = bytearray(b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xff')
def pack_ip(buf, off, ip_addr):
    try:
        buf[off:off+12] = ipv4prefix[:]
        buf[off+12:off+16] = socket.inet_pton(socket.AF_INET, ip_addr)
    except socket.error:
        try:
            buf[off:off+16] = socket.inet_pton(socket.AF_INET6, ip_addr)
        except socket.error:
            return None
    return 16

# All IP addresses are 16 bytes long. IPV4 addresses are prefixed with 10 0's, 2 0xff's, and 4 bytes of address. IPV6 addresses are 16 bytes long.
ipv4prefix = bytearray(b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xff')
def unpack_ip(buf, off):
    if buf[off:off+12] == ipv4prefix[0:12]:
        return 16, socket.inet_ntop(socket.AF_INET, buf[off+12:off+16])
    else:
        return 16, socket.inet_ntop(socket.AF_INET6, buf[off:off+16])

def pack_ips(buf, off, iplist):
    initialoff=off

    off += pack_int(buf, off, len(iplist))
    for ip, port in iplist:
        off += pack_ip(buf, off, ip)
        off += pack_short(buf, off, port)
    return off-initialoff

def unpack_ips(buf, off):
    initialoff=off

    peers=[]
    flen, npeers = unpack_int(buf, off)
    off += flen
    for i in range(npeers):
        flen, peerip = unpack_ip(buf, off)
        off += flen
        flen, peerport = unpack_short(buf, off)
        off += flen
        peers.append((peerip, peerport))
    return off-initialoff, peers

#########################################################
# Logging and printing diagnostics

_hostname = '[Unassigned]'
_log_level = 0
_default_log = None
# The time (in seconds) to cycle through to another log.
LOG_ROTATION_INTERVAL = 24 * 3600
LOGOPTION_ENABLE_LOGGING=True
LOGOPTION_FLUSH_LOG=True
LOGOPTION_DUMPLOG=True

# Log class 
# Logging is asynchronous, the logged messages are written asynchronously 
# to a log file in the background. 
# The log files are rotated in regular intervals
class Log:
    LOG_FLUSH_SIZE = 4096  # We flush every 4 KiB

    def __init__(self):
        self.log = []
        self.log_size = 0

        self.lock = Lock()
        self.needs_flush = Condition(self.lock)
        self.last_rotation_time = time.time()
        self.filename = os.path.join(os.getcwd(), 'logs',strftime("%Y-%m-%d-%H:%M:%S+0000", gmtime()) + ".log")
        self.dumper = Thread(target=self.log_dumper)
        self.dumper.setDaemon(True)
        self.is_alive = True

        self.dumper.start()

    def write(self, msg):
        if LOGOPTION_ENABLE_LOGGING:
            with self.lock:
                self.log.append(msg)
                self.log_size += len(msg)

                if self.log_size >= Log.LOG_FLUSH_SIZE:
                    self.needs_flush.notify()

    def close(self):
        with self.lock:
            self.is_alive = False
            self.needs_flush.notify()

        self.dumper.join()

    def log_dumper(self):
        f = open(self.filename, "a+")
        alive = True

        try:
            while alive:
                with self.lock:
                    alive = self.is_alive
                    while self.log_size < Log.LOG_FLUSH_SIZE and self.is_alive:
                        self.needs_flush.wait()

                    oldlog = self.log
                    self.log = []
                    self.log_size = 0

                for msg in oldlog:
                    f.write(msg)

                if LOGOPTION_FLUSH_LOG:
                    f.flush()

                # Checks whether we've been dumping to this logfile for a while
                # and opens up a new file.
                now = time.time()
                if now - self.last_rotation_time > LOG_ROTATION_INTERVAL:
                    self.last_rotation_time = now
                    self.filename = strftime("%Y-%m-%d-%H:%M:%S+0000", gmtime()) + ".log"

                    f.flush()
                    f.close()

                    with open("current.log", "w") as of:
                        of.write(self.filename)

                    f = open(self.filename, "a+")

        finally:
            f.flush()
            f.close()


_log = Log()

class LogColor:
    RED   = "\033[1;31m"  
    BLUE  = "\033[1;34m"
    CYAN  = "\033[1;36m"
    GREEN = "\033[0;32m"
    RESET = "\033[0;0m"
    BOLD    = "\033[;1m"
    REVERSE = "\033[;7m"

# An enum that stores the different log levels
class LogLevel:
    CRASH = 0
    ERROR = 1
    WARNING = 2
    DEBUG = 3
    VERBOSE = 4

# Cleanly closes the log and flushes all contents to disk.
def log_close():
    _log.close()

def log_setmyname(name):
    global _hostname

    _hostname = '[' + name + ']'

def log(level, logtype, loc, msg, log_time):
    global _hostname

    if level < _log_level:
        return  # No logging if it's not a high enough priority message.

    msg = loc + ": " + msg
    logmsg = "{0}: {1} [{2}]: {3}\n".format(_hostname, logtype, log_time.strftime("%Y-%m-%d-%H:%M:%S+%f"), msg)

    _log.write(logmsg)

    # Print out crash logs to the console for easy debugging.
    if LOGOPTION_DUMPLOG or level == LogLevel.CRASH:
        if level == LogLevel.VERBOSE:
            logmsg = LogColor.GREEN + logmsg + LogColor.RESET
        if level == LogLevel.WARNING:
            logmsg = LogColor.CYAN + logmsg + LogColor.RESET
        if level == LogLevel.ERROR:
            logmsg = LogColor.RED + logmsg + LogColor.RESET
        sys.stdout.write(logmsg)

def log_debug(*msg):
    loc = inspect.stack()[1][3]
    msg = msg[0] if len(msg) == 1 else str(msg)
    log(LogLevel.DEBUG, "DEBUG  ", loc, msg, datetime.utcnow())

def log_error(*msg):
    loc = inspect.stack()[1][3]
    msg = msg[0] if len(msg) == 1 else str(msg)
    log(LogLevel.ERROR, "ERROR  ", loc, msg, datetime.utcnow())

def log_warning(*msg):
    loc = inspect.stack()[1][3]
    msg = msg[0] if len(msg) == 1 else str(msg)
    log(LogLevel.WARNING, "WARNING", loc, msg, datetime.utcnow())

def log_crash(*msg):
    loc = inspect.stack()[1][3]
    msg = msg[0] if len(msg) == 1 else str(msg)
    log(LogLevel.CRASH, "CRASH  ", loc, msg, datetime.utcnow())

def log_verbose(*msg):
    loc = inspect.stack()[1][3]
    msg = msg[0] if len(msg) == 1 else str(msg)
    log(LogLevel.VERBOSE, "VERBOSE", loc, msg, datetime.utcnow())


#########################################################
# Network helpers

def get_myip():
    # XXX change this to consult a json-returning external service and return a v4 or v6 address as approriate
    return "127.0.0.1"

