# Copright (C) 2018, Emin Gun Sirer
# See the file COPYING for details.

import time
import os
import random
import shutil
import plyvel
import json
import decimal
import select
import socket
import errno
from threading import Thread, Lock, Condition

import dag
import messages
from transaction import Transaction
from wallet import SuperWallet
from utils import *
from params import *

class IODesc:
    def __init__(self, node, txhash, tx=None):
        self.node = node
        self.txhash = txhash
        self.tx = tx

        self.querysent = False
        self.txpresent = False
        self.sources = set()
        self.requested = set()

        self.query_received = []            # list of conns from which we got a query for this tx, but did not answer yet

        self.timeoflastmsg = time.time()
        self.sampled = {}                   # list of sampled connections
        self.responses = {}                 # mapping from conn to responses

    # used to select peers to sample
    def sample(self):
        # XXX need to select just the staking peers for this sampling operation
        self.sampled = self.node.peers.sample(3)
        return self.sampled

    # record what we heard from this peer
    def recordresponse(self, conn, response):
        self.responses[conn] = response

    # sample without replacement
    def resample(self):
        peers

class Node:
    DEFAULT_PORT = 9630     # port for all Avalanche communication
    DEFAULT_RPC_PORT = -1   # port for rpc requests to the Avalanche daemon, -1 means the port is not open by default

    def __init__(self, ipaddr='0.0.0.0', port=DEFAULT_PORT, rpc_ipaddr='0.0.0.0', rpc_port=DEFAULT_RPC_PORT, dag=None, peers=[]):
        self.epoll = select.epoll()
        self.myip = get_myip() if ipaddr == "0.0.0.0" else ipaddr
        self.myport = port
        self.mynonce = get_nonce()                                                # used to identify network level loops
        self.myversion = "avalanche/0.0.1"                                        # protocol / version, where protocol is "avalanche" or "avalanchelite"
        self.dag = dag
        self.mywallet = SuperWallet(node=self, dag=dag)
        self.serversocket = self.create_server_socket(ipaddr, self.myport)
        self.rpcsocket = self.create_server_socket(rpc_ipaddr, rpc_port) if rpc_port != -1 else None
        self.iodesc = {}                                                          # set of outstanding operations, indexed by txhash
        self.epochs = EpochHistory({"capitaldelta": 10, "interestrate": 2.0})

        # Connection pool to store connections
        self.peers = ConnectionPool()
        for peeraddr in peers:
            try:
                peerip, peerport = peeraddr.split(':')
                connection = self.create_connection(peerip, int(peerport))
            except ValueError:
                log_error("Bad seed peer address: %s" % peeraddr)
                # we ignore this seed
            except socket.error as e:
                log_error("Cannot connect to seed: %s" % peeraddr)
        self.pendingpeers = [] # list of (ipaddr, port) tuples
        self.pendingpeers_lock = Lock()
        self.pendingpeers_nonempty = Condition(self.pendingpeers_lock)
        self.blacklist = []                                                           # XXX not implemented yet
        self.connectorhelperthread = Thread(target=self.connector, daemon=True)
        self.connectorhelperthread.start()
    ####################################
    # Socket management

    # Create and initialize a nonblocking server socket with at most 50 connections in its backlog, bound to an interface and port
    def create_server_socket(self, intf, serverport):
        log_debug("Creating a server socket on {0}:{1}".format(intf, serverport))

        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((intf, serverport))
            s.listen(50)
            s.setblocking(0)
            self.epoll.register(s.fileno(), select.EPOLLIN | select.EPOLLET)
            log_debug("Finished creating a server socket on {0}:{1}".format(intf, serverport))
            return s
        except socket.error as e:
            log_crash("Fatal error: " + str(e.errno) + " " + e.strerror + " occurred while setting up serversocket on {0}:{1}. Exiting...".format(intf, serverport))
            if e.errno in [errno.EACCES, errno.EADDRINUSE, errno.EADDRNOTAVAIL, errno.ENOMEM, errno.EOPNOTSUPP]:
                exit(1)
            else:
                raise e

    # Create a connection to a peer
    def create_connection(self, ip, port):
        log_debug("Initiating connection to {0}:{1}.".format(ip, port))
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
            sock.connect((ip, port))
            conn = self._wrap_socket(sock, ip, port)
            connnonce = get_nonce()
            conn.connectionnonce ^= connnonce
            vmsg = messages.Message({"command": "version", 
                                     "hostnonce": self.mynonce, "connectionnonce": connnonce,
                                     "srcip": self.myip, "srcport" : self.myport, 
                                     "dstip": ip, "dstport": port, 
                                     "mytime": time.time(),
                                     "versionstr": self.myversion})
            conn.send(vmsg)
            conn.state = ConnectionState.SENT_VERSION
            return conn
        except socket.error as e:
            if e.errno in [errno.EPERM, errno.EADDRINUSE]:
                log_error("Connection to {0}:{1} failed! Got errno {2} with msg {3}.".format(ip, port, e.errno, e.strerror))
            elif e.errno in [errno.EAGAIN, errno.ECONNREFUSED, errno.EINTR, errno.EISCONN, errno.ENETUNREACH, errno.ETIMEDOUT]:
                log_error("Connection to {0}:{1} failed. Got errno {2} with msg {3}.".format(ip, port, e.errno, e.strerror))
            else:
                raise e
        return None

    # thread that connects to newly discovered hosts
    def connector(self):
        while True:
            with self.pendingpeers_lock:
                while len(self.pendingpeers) == 0:
                    self.pendingpeers_nonempty.wait()
                peerip, peerport = self.pendingpeers.pop()
            log_debug("trying to connecto to %s:%d" % (str(peerip), peerport))
            # XXX check to see if this IP address is on a blacklist
            # XXX check to see if we have too many connections to this IP prefix already

            # create a connection and add it to the epoll loop. epoll is thread-safe.
            conn = self.create_connection(peerip, peerport)
        
    # wrap a connection object around a socket
    def _wrap_socket(self, sock, ip, port):
        log_debug("Setting up connection with {0}:{1}.".format(ip, port))

        # Make the socket asynchronous
        sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        sock.setblocking(0)
   
        # Make a connection object and set its state 
        conn_obj = Connection(self, sock, ip, port)
        conn_obj.state = ConnectionState.NASCENT

        # Start listening to the other side
        self.peers.add(ip, port, conn_obj)
        self.epoll.register(sock.fileno(), select.EPOLLOUT | select.EPOLLIN | select.EPOLLERR | select.EPOLLHUP | select.EPOLLET)
        log_debug("Connected {0}:{1} on file descriptor {2} with state {3}".format(ip, port, sock.fileno(), conn_obj.state))
        return conn_obj

    # Close the connection associated with the given socket
    def destroy_connection(self, fileno):
        conn = self.peers.get_bysocket(fileno)
        log_debug("Breaking connection to {0}".format(conn))

        # Get rid of the connection from the epoll and the connection pool, shut it down
        self.epoll.unregister(fileno)
        self.peers.delete(conn)
        conn.close()

    # Main loop of this Node. Returns when Node crashes or is stopped.
    # Handles events as they get triggered by epoll.
    # Fires alarms that get scheduled.
    def run(self):
        timeout = 1000
        try:
            while True: 
                # Grab all events.
                try:
                    events = self.epoll.poll(timeout)
                except IOError as ioe:
                    if ioe.errno == errno.EINTR:
                        continue
                    raise ioe

                for fileno, event in events:
#                    log_verbose("new event " + str(event) + " in epoll loop for socket " + str(fileno))

                    # handle incoming connection on the server port
                    if fileno == self.serversocket.fileno():
                        new_socket, address = self.serversocket.accept()
                        log_debug("new connection from " + str(address))
                        ip = address[0]
    
                        # XXX check to see if we have too many connections from this IP block
                        # if self.peers.get_num_conn_by_ip(ip) >= MAX_CONN_BY_IP:
                        #      log_err("The IP " + ip + " has too many connections! Closing...")
                        #      new_socket.close()
                        # else:
                        conn = self._wrap_socket(new_socket, address[0], address[1])
    

                    # handle rpc request from the rpc server port
                    # we assume that the rpc server port is protected using OS protections
                    elif self.rpcsocket is not None and fileno == self.rpcsocket.fileno():
                        new_socket, address = self.rpcsocket.accept()
                        log_debug("new RPC connection from " + str(address))
                        ip = address[0]
                        conn = self._wrap_socket(new_socket, address[0], address[1])
                        conn.isrpc = True

                    # Handle all EPOLLHUP and EPOLLOUT events.
                    else:
                        conn = self.peers.get_bysocket(fileno)

                        # Mark this connection for close if we received a POLLHUP. No other functions will be called on this connection.
                        if event & select.EPOLLHUP:
                            log_debug("POLLHUP received on {0}".format(conn))
                            conn.state = ConnectionState.MARK_FOR_CLOSE
 
                        if event & select.EPOLLOUT and not (conn.state == ConnectionState.MARK_FOR_CLOSE):
#                            log_debug("send event on {0}".format(conn))

                            # Send as much as we can from the outputbuffer.
                            conn.send()

                # Handle EPOLLIN events.
                for fileno, event in events:
                    # we already handled the new connections above, no need to handle them again
                    if (self.rpcsocket == None or fileno != self.rpcsocket.fileno()) and fileno != self.serversocket.fileno():
                        conn = self.peers.get_bysocket(fileno)

                        if event & select.EPOLLIN and not (conn.state == ConnectionState.MARK_FOR_CLOSE):
#                            log_debug("recv event on {0}".format(conn))
                            conn.recv()

                        if conn.state & ConnectionState.MARK_FOR_CLOSE:
#                            log_debug("Connection to {0} closing".format(conn))
                            self.destroy_connection(fileno)
 
                # XXX timeout = self.alarm_queue.fire_ready_alarms(not events)

        # Handle shutdown of this node.
        finally:
            self.cleanup_node()

    def cleanup_node(self):
        log_close()

    ####################################
    # Message processing 

    def handle_message(self, conn, msg):
#        log_debug("handling %s message from %s" % (msg.fields["command"], conn))

        # XXX check that the checksum has the right number of leading 0's given the load that this peer has generated for us recently
        # XXX do not ask for pow on rpc connections         if not conn.isrpc:
        # msg.fields["checksum"] has the full checksum already computed at a layer below
        # this is a local PoW computation, used solely for spam deterrence. 
        # the difficulty level depends on the rate with which this peer interacts with us and is set in the connection 
        # XXX we might have to send an "insufficient PoW" message to the peer so he retries later on

        m = getattr(self, "msg_" + msg.fields["command"])
        m(conn, msg)
        
    def msg_ping(self, peer, msg):
        log_debug("received a ping from %s" % conn)
        pong = messages.Message({"command": "pong"})
        conn.send(pong)

    def msg_pong(self, peer, msg):
        log_debug("received a pong from %s" % conn)

    def msg_version(self, conn, msg):
        log_debug("received a version from %s" % conn)

        #check to make sure that we did not accidentally connect to ourselves
        if msg.fields["hostnonce"] == self.mynonce:
            log_error("ended up connecting to self via %s, closing" % conn)
            conn.state |= ConnectionState.MARK_FOR_CLOSE
            return

        if conn.state & ConnectionState.GOT_VERSION:
            log_debug("we already received a version message from peer %s before, disconnecting" % conn)
            conn.state |= ConnectionState.MARK_FOR_CLOSE
            return

        conn.state |= ConnectionState.GOT_VERSION
        conn.connectionnonce ^= msg.fields["connectionnonce"]

        # save the remote peer's version string
        conn.peerversion = msg.fields["versionstr"]
        conn.isliteclient = conn.peerversion.startswith("avalanchelite")

        # check to make sure that the peer is compatible with my version
        iscompat = check_compatibility(self.myversion, conn.peerversion)
        if not iscompat:
            log_error("not compatible with peer %s, version %s" % (conn, conn.peerversion))
            conn.state |= ConnectionState.MARK_FOR_CLOSE
            return

        # check to make sure that the peer is within CLOCKSYNC of my local clock
        histime = msg.fields["mytime"] 
        mytime = time.time()
        if abs(histime - mytime) > CLOCKSYNC:
            log_error("peer's clock is too far out of sync compared to mine, his: %s mine: %s" % (time.ctime(histime), time.ctime(mytime)))
            conn.state |= ConnectionState.MARK_FOR_CLOSE
            return

        # XXX check to make sure that the IP address the peer uses to identify itself matches what the socket says
        # XXX if conn.socket.getpeeripaddress != msg.fields["srcip"]:
        # XXX     drop the connection
        # XXX
        if not conn.remember_advertised_address(msg.fields["srcip"], msg.fields["srcport"]):
            # peer is trying to change IP address
            log_error("dropping connection to peer %s" % (conn))
            conn.state |= ConnectionState.MARK_FOR_CLOSE
            return
        
        # respond to the peer with verack
        verack = messages.Message({"command": "verack", "hostnonce": msg.fields["hostnonce"]})
        conn.send(verack)

        # if we did not already send a version message to the other side, send it
        if not conn.state & ConnectionState.SENT_VERSION:
            connnonce = get_nonce()
            conn.connectionnonce ^= connnonce
            vmsg = messages.Message({"command": "version", 
                                     "hostnonce": self.mynonce, "connectionnonce": connnonce,
                                     "srcip": self.myip, "srcport" : self.myport, 
                                     "dstip": conn.peerip, "dstport": conn.peerport, 
                                     "mytime": time.time(),
                                     "versionstr": self.myversion})
            conn.send(vmsg)
            conn.state |= ConnectionState.SENT_VERSION

        if (conn.state & ConnectionState.SENT_VERSION) and (conn.state & ConnectionState.GOT_VERACK) and (conn.state & ConnectionState.GOT_VERSION):
            if conn.connection_established():
                # ask for the peerlist
                gpmsg = messages.Message({"command": "getpeerlist"})
                conn.send(gpmsg)

    def msg_verack(self, conn, msg):
        log_debug("received a verack from %s" % conn)
        if conn.state & ConnectionState.SENT_VERSION:
            conn.state |= ConnectionState.GOT_VERACK
        else:
            log_error("peer %s sent verack without hearing version from us" % (conn))
            conn.state |= ConnectionState.MARK_FOR_CLOSE
            return
            
        if msg.fields["hostnonce"] != self.mynonce:
            log_error("peer %s sent verack with a nonce %x that is not mine %x" % (conn, msg.fields["hostnonce"], self.mynonce))
            conn.state |= ConnectionState.MARK_FOR_CLOSE
            return
            
        if (conn.state & ConnectionState.SENT_VERSION) and (conn.state & ConnectionState.GOT_VERACK) and (conn.state & ConnectionState.GOT_VERSION):
            if conn.connection_established():
                # ask for the peerlist
                gpmsg = messages.Message({"command": "getpeerlist"})
                conn.send(gpmsg)

    def msg_getpeerlist(self, conn, msg):
        log_debug("received a getpeerlist from %s" % conn)
        addresses = []

        for peerconn in self.peers.values():
            if not peerconn.isliteclient and not peerconn.isrpc and (peerconn.state & ConnectionState.CONNECTED):
                
                log_warning("telling %s about %s" % (conn, peerconn))
                # XXX debugging only, delete
                if peerconn.peerport > 3000: 
                    log_warning("telling %s about %s" % (conn, peerconn))
                addresses.append((peerconn.peerip, peerconn.peerport))
        
        plmsg = messages.Message({"command": "peerlist", "peers": addresses})
        # make sure the resulting list is not longer than the max packet size
        if plmsg.pktlength > MAX_PACKET_LENGTH:
            # XXX do something reasonable
            log_error("the peerlist packet we produced is longer than permissible")
            return
        conn.send(plmsg)

    def msg_peerlist(self, conn, msg):
        log_debug("received a peerlist from %s" % conn)
        for peerip, peerport in msg.fields["peers"]:
            #if it's me, skip
            if peerip == self.myip and peerport == self.myport:
                continue
            #if it's someone to whom I already have a connection, skip
            if self.peers.get_byipport(peerip, peerport) is not None:
                continue
            # queue up the new peers so we can asynchronously connect to them
            log_debug("discovered %s:%d" % (peerip, peerport))
            with self.pendingpeers_lock:
                self.pendingpeers.append((peerip, peerport))
                self.pendingpeers_nonempty.notify()

    def issuetx(self, tx):
        log_debug("want to issue a tx with hash %s" % (tx.txhash()))

        iod = IODesc(self, tx.txhash(), tx)
        iod.txpresent=True
        iod.querysent=True
        self.iodesc[iod.txhash] = iod
        for c in iod.sample():
            log_debug("sending a query request to %s" % str(c))
            msg=messages.Message({"command": "query", "txhash": tx.txhash(), "sources": ["%s:%d" % (self.myip, self.myport)]})
            c.send(msg)
        self.dag.insert(tx)

    def msg_query(self, conn, msg):
        log_debug("received a query from %s for %s" % (conn, binascii.hexlify(msg.fields["txhash"])))
        SUPPRESS_PERIOD = 1000000  # if we have a message outstanding, wait at least this long before you send out a new one

        # get the transaction
        txhash = msg.fields["txhash"]
        iod = self.iodesc[txhash] if txhash in self.iodesc else None
        tx = self.dag.lookup(txhash)

        # XXX if tx exists and this transaction has been decisively accepted or rejected, respond accordingly
        if tx is not None:
            pass
        # if we have never heard of this transaction before, create an IO descriptor that we will use until we are done collecting chits for this transaction
        if iod is None:
            iod = IODesc(self, txhash)
            self.iodesc[txhash] = iod

        # if it is not present, and people are pestering us for it, request it with a gettx
        if tx is None and not iod.txpresent:
            # find the connections from which we can request this transaction
            for peerdesc in msg.fields["sources"]:
                log_debug("learned of source %s" % peerdesc)
                aconn = self.peers.get_bypeerdesc(peerdesc)
                iod.sources.add(aconn)
            # record the person who queried us, for we will have to respond to them later
            iod.query_received.append(conn)

            # if we have an outstanding request, and we sent it too recently to have heard a response, do not send another request
            if len(iod.requested) > 0 and time.time() - iod.timeoflastmsg < SUPPRESS_PERIOD:
                return

            # send our request to someone from whom we heard about this tx
            asource = random.choice(list(iod.sources - set(iod.requested)))  # XXX this is inefficient
            # update list of outstanding requests
            iod.requested.add(asource)
            log_debug("soliciting tx with hash %s" % binascii.hexlify(txhash))
            msg=messages.Message({"command": "gettx", "txhash": txhash})
            asource.send(msg)
            iod.timeoflastmessage = time.time()
            return

        # respond with a chit message
        mychitnow = 1 if self.dag.is_strongly_preferred(tx) else 0
        msg=messages.Message({"command": "chit", "chitval": mychitnow, "txhash": txhash})
        conn.send(msg)

    def msg_gettx(self, conn, msg):
        log_debug("received a gettx from %s for %s" % (conn, binascii.hexlify(msg.fields["txhash"])))

        txhash = msg.fields["txhash"]
        # is it already in the dag?
        tx = self.dag.lookup(txhash)
        if tx is None:
            # is it a transaction we are currently working on?
            iod = self.iodesc[txhash] if txhash in self.iodesc else None
            if iod is None:
                log_error("peer %s asked us for a txhash %s we do not have" % (conn, txhash))
                return
            tx = iod.tx
        assert tx is not None, "should not happen"
        msg=messages.Message({"command": "tx", "txhash": txhash, "txbody": tx})
        conn.send(msg)
        
    def msg_tx(self, conn, msg):
        log_debug("received a tx body from %s for %s" % (conn, binascii.hexlify(msg.fields["txhash"])))

        txhash = msg.fields["txhash"]
        tx = Transaction(msg.fields["txbody"])
        # check its actual txhash against reported txhash
        if txhash != tx.txhash():
            log_error("peer %s sent us a tx with hash %s, pretending it was %s" % (conn, tx.txhash(), txhash))
            return
        # ignore it if it is not a transaction that we solicited
        if txhash not in self.iodesc:
            log_error("peer %s sent us tx with hash %s, unsolicited" % (conn, binascii.hexlify(tx.txhash())))
            return

        iod = self.iodesc[txhash]
        # see if the person we are hearing from is someone we asked
        if conn not in set(iod.requested):
            log_warn("peer %s sent us tx with hash %s. we wanted this tx but did not ask him" % (conn, tx.txhash()))
            # not a problem

        # mark the transaction as present
        iod.txpresent = True
        # XXX check to see if the transaction is valid
        # XXX check to see if the transaction has unmet dependencies

        # if it is not already in the DAG, insert it there
        if self.dag.lookup(txhash) is None:
            self.dag.insert(tx)

        # respond to everyone to whom we owe a response on this tx
        for aconn in iod.query_received:
            mychitnow = 1 if self.dag.is_strongly_preferred(tx) else 0
            msg=messages.Message({"command": "chit", "chitval": mychitnow, "txhash": txhash})
            conn.send(msg)
        iod.query_received = []

        # send a query of our own
        iod.querysent=True
        for c in iod.sample():
            log_debug("sending a query request to %s" % str(c))
            msg=messages.Message({"command": "query", "txhash": tx.txhash(), "sources": ["%s:%d" % (self.myip, self.myport)]})
            c.send(msg)

    def msg_chit(self, conn, msg):
        log_debug("received a chit from %s for %s" % (conn, binascii.hexlify(msg.fields["txhash"])))

        txhash = msg.fields["txhash"]
        if txhash not in self.iodesc:
            log_error("peer %s sent us a chit for hash %s, which has no IODescriptor" % (conn, binascii.hexlify(tx.txhash())))
            return

        iod = self.iodesc[txhash]
        if msg.fields["chitval"] < 0 or msg.fields["chitval"] > 1:
            log_error("received a non binary chit from %s for %x" % (conn, msg.fields["txhash"]))
            conn.state |= ConnectionState.MARK_FOR_CLOSE
            return
        try:
            idx = iod.sampled.index(conn)
        except ValueError:
            log_debug("received an unsolicited chit from an unsampled peer %s" % conn)
            return

        del iod.sampled[idx]
        iod.responses[conn] = msg.fields["chitval"]
        # XXX collect the responses
        if len(iod.responses) == 3:
            log_verbose("total of %d responses received" % len(iod.responses))
# XXX        tx.apply_chit(msg.fields["chitval"])

    ############################################
    # Wallet RPC processing

    def msg_rpc(self, conn, msg):
        jsreq = json.loads(msg.fields["json"])
        m = getattr(self.mywallet, jsreq["jsonop"])
        response = m(jsreq)
        respstr = json.dumps(response)
        msg=messages.Message({"command": "rpcresponse", "json": respstr})
        conn.send(msg)

# A group of connections with active sockets
class ConnectionPool:
    def __init__(self):
        self.lock = Lock()
        self.connlist = []
        self.byipport = {}
        self.bysocket = {}

    # Add a connection to the named peer
    def add(self, ip, port, conn):
        with self.lock:
            self.connlist.append(conn)
            self.byipport[conn.peer_desc] = conn
            self.bysocket[conn.socket.fileno()] = conn

    # Delete this connection from the connection pool
    def delete(self, conn):
        with self.lock:
            # Remove conn from the dictionaries
            self.connlist.remove(conn)
            if conn.peer_desc in self.byipport:
                del self.byipport[conn.peer_desc]
            if conn.socket.fileno() in self.bysocket:
                del self.bysocket[conn.socket.fileno()]

    def __len__(self):
        with self.lock:
            return len(self.connlist)

    def sample(self, num):
        with self.lock:
            if num > len(self.connlist):
                log_error("population of %d is too small to sample by %d" % (len(self.connlist), num))
                return []
            # XXX need to sample only those nodes that have staked
            return random.sample([x for x in self.connlist if not x.isrpc and x.isstaked], num)

    def get_byipport(self, ip, port):
        desc = "%s:%d" % (ip, port)
        return self.get_bypeerdesc(desc)

    # desc is a peer descriptor, of format "%s:%d" % (ip, port)
    def get_bypeerdesc(self, desc):
        with self.lock:
            if desc in self.byipport:
                return self.byipport[desc]
            return None

    def get_bysocket(self, socketno):
        with self.lock:
            return self.bysocket[socketno]

    # Updates a connection with a new port
    def update_ipport(self, conn, newip, newport):
        with self.lock:
            log_debug("updating peer %s to %s:%d" % (conn.peer_desc, newip, newport))
            if conn.peer_desc not in self.byipport or conn.peerip != newip:
                log_error("should not happen, peer %s changing IP address to %s" % (conn, newip))
                return False

            newdesc = "%s:%d" % (newip, newport)
            # If there will be a collision or the ip addresses are changing, then we cannot update
            if newdesc in self.byipport:
                log_error("should not happen, connection to this peer already exists in connection pool %s" % (self))
                return False

            log_debug("peer changing descriptor from %s to %s" % (conn.peer_desc, newdesc))
            del self.byipport[conn.peer_desc]
            self.byipport[newdesc] = conn
            return True

    def values(self):
        with self.lock:
            return self.byipport.values()

    def dump(self):
        with self.lock:
            for desc in self.byipport:
                log_debug("connection to %s, state %x" % (desc, self.byipport[desc].state))

class ConnectionState:
    NASCENT=0         # Just starting
    SENT_VERSION=1    # We sent our version message, flag bit
    GOT_VERACK=2      # We got a verack, flag bit
    GOT_VERSION=4     # We got a version message, flag bit
    CONNECTED=8       # Both sides sent version messages and received verack responses, all clear
    MARK_FOR_CLOSE=16 # Mark this connection to be closed at the earliest opportunity
    CLOSED=32         # Connection is closed

MAX_PACKET_LENGTH=10*1024*1024  # maximum size of any network packet
CHUNKSIZE=64*1024               # how much data to collect from the kernel at a time, any number in range (0, MAX_PACKET_LENGTH]

class Connection:
    def __init__(self, node, socket, peerip, peerport, peerversion=None):
        self.node = node
        self.socket = socket
        self.peerip = peerip
        self.peerport = peerport
        self.peer_desc = "%s:%d" % (peerip, peerport)
        self.peerversion = peerversion
        self.connectionnonce = 0
        self.state = ConnectionState.NASCENT
        self.last_heard = time.time()    # last time when we received a well-formatted message in full
        self.isliteclient = False        # the identities of lite clients do not need to be widely gossiped or known
        self.isrpc = False               # this peer is connected to the rpc port
        self.isstaked = True             # this is a peer that has put up a stake XXX FIX THIS 

        #send and receive buffers
        self.send_buffer = b''
        self.recv_buffer = b''

    def close(self):
        self.send_buffer = self.recv_buffer = None
        self.state = ConnectionState.CLOSED
        try:
            self.socket.shutdown(socket.SHUT_RDWR)
            self.socket.close()
        except OSError as e:
            log_debug("error during socket close: " + str(e.errno) + " " + e.strerror + " while closing " + self.peer_desc)

    def remember_advertised_address(self, newip, newport):
        if self.peerip != newip:
            log_error("peer's advertised ip address %s is not the same as its actual ip address %s" % (self.peerip, newip))
            return False
        self.advertisedip = newip
        self.advertisedport = newport
        return True

    def connection_established(self):
        self.node.peers.dump()
        # see if any of our information has changed
        #   if not, we are already listed in the connection pool under the right name
        if self.advertisedip != self.peerip:
            log_error("peer is changing its ip address, should not happen, %s" % (conn))
            return False
        if self.advertisedport != self.peerport:
            # check to see if there is already a different connection to this peer
            other = self.node.peers.get_byipport(self.advertisedip, self.advertisedport)
            if other is not None and self != other:
                # destroy the connection with the high numbered connection nonce
                if self.connectionnonce < other.connectionnonce:
                    log_warning("duplicate connection, deleting the other one %s" % (other))
                    other.state |= ConnectionState.MARK_FOR_CLOSE
#                    self.node.destroy_connection(other.socket.fileno())
                else:
                    log_warning("duplicate connection, deleting self %s" % (self))
                    self.state |= ConnectionState.MARK_FOR_CLOSE
#                    self.node.destroy_connection(self.socket.fileno())
                    return False
            if not self.node.peers.update_ipport(self, self.advertisedip, self.advertisedport):
                log_error("connection pool update failure")
                self.state |= ConnectionState.MARK_FOR_CLOSE
                return False
            self.peer_desc = "%s:%d" % (self.advertisedip, self.advertisedport)
            self.peerip = self.advertisedip
            self.peerport = self.advertisedport
        self.state |= (ConnectionState.CONNECTED | ConnectionState.GOT_VERSION | ConnectionState.GOT_VERACK) 
        log_debug("handshake complete with %s" % self)
#        log_warning("connections: %s" % (str([x for x in self.node.peers.values()])))
        return True

    # receive as many bytes as possible from the connection, and process the packets received
    def recv(self):
        # process as many messages as we have the complete bytes for
        while True:
            # XXX limit the number of bytes that can be read to prevent this DoS vector
            try:
                chunk = self.socket.recv(CHUNKSIZE)
#                log_debug("collected %d bytes" % len(chunk))
            except socket.error as e:
                if e.errno in [errno.EAGAIN, errno.EWOULDBLOCK]:
                    break
                elif e.errno in [errno.EINTR]: 
                    # we were interrupted, try again
                    log_debug("Received errno {0} with msg {1}, recv on {2} failed. Continuing recv.".format(e.errno, e.strerror, self.peer_desc))
                    continue
                elif e.errno in [errno.ECONNREFUSED, errno.ECONNRESET, errno.ETIMEDOUT, errno.EBADF]:
                    # Fatal errors for 
                    log_debug("Received errno {0} with msg {1}, recv on {2} failed. Closing connection and retrying...".format(e.errno, e.strerror, self.peer_desc))
                    self.state |= ConnectionState.MARK_FOR_CLOSE
                    return
                elif e.errno in [errno.EFAULT, errno.EINVAL, errno.ENOTCONN, errno.ENOMEM]:
                    # Should never happen errors
                    log_err("Received errno {0} with msg {1}, recv on {2} failed. This should never happen...".format(e.errno, e.strerror, self.peer_desc))
                    return
                else:
                    raise e

            if len(chunk) == 0:
                self.state |= ConnectionState.MARK_FOR_CLOSE
                return
#            log_debug("adding %d bytes" % len(chunk))
            self.recv_buffer += chunk

        # while we have a packet or more, process them
        while len(self.recv_buffer) >= 4: 
            _, plen = unpack_int(self.recv_buffer, 0)
            if plen > MAX_PACKET_LENGTH:
                log_error("other side sent a huge packet of size %d bytes" % plen)
                # XXX close the connection to this peer
            if len(self.recv_buffer) < plen:
                  # did not receive a full packet yet
                  return 

            # parse the message and handle it
            packet = self.recv_buffer[:plen]
# XXX try:
#            print(packet)
            msg = messages.Message(buf=packet)
#            log_debug("got a %s packet to process" % msg.fields["command"])
            self.node.handle_message(self, msg)

#            except Exception as e:
#                # XXX do something appropriate for this peer and the error in question
#                log_debug("error")
#                pass

            # remove the message bytes from the buffer
            self.recv_buffer = self.recv_buffer[plen:]

    def send(self, message=None):
        #log_debug("Sending message " + message)
        if message is not None:
            packet = memoryview(message.buf)[0:message.pktlength]
            plen = len(packet)
        #
        # if there is no send_buffer, we just send it immediately, and queue up the remainder
        if message is not None and len(self.send_buffer) == 0:
            try:
                nsent = self.socket.send(packet)
#                log_debug("sent %s message to %s of length %d, %d bytes went through" % (message.fields["command"], self.peer_desc, plen, nsent))
            except Exception as e:
                log_error("send message failed to %s of length %d, with error %d" % (self.peer_desc, plen, e.errno))
                self.state |= ConnectionState.MARK_FOR_CLOSE
                return
            if nsent != plen:
                  # queue up the remainder
                  self.send_buffer += packet[nsent:]
        else:
            if message is not None:
                self.send_buffer += packet
            try:
                nsent = self.socket.send(self.send_buffer)
#                log_debug("drained %d bytes to %s from the send buffer" % (nsent, self.peer_desc))
            except Exception as e:
                if e.errno in [errno.EAGAIN, errno.EWOULDBLOCK]:
                    return
                log_debug("send failed to drain send buffer to %s, with error %d" % (self.peer_desc, e.errno))
                # XXX do something appropriate, such as shutting down the connection
                return
            # advance the buffer by the amount sent
            self.send_buffer = self.send_buffer[nsent:]

    def __str__(self):
        return '<Connection to %s state=%x>' % (self.peer_desc, self.state)

# check to make sure that the peer and I speak the same language
def check_compatibility(me, him):
    # at the moment, we are all compatible
    return True
