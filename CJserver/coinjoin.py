from assetinfo import AVAX_FUJI_ID, convert_to_asset_id, convert_to_asset_name
import json
import subprocess
import time
import string

from assetinfo import *
from messages import send_errmessage, send_message, send_signedtx, send_wiretx, send_accepted_txid, send_nonce
from utils.httprequest import *
from params import *
from decimal import Decimal, getcontext
from struct import *
from utils.bufferutils import convert_to_jsbuffer, pack_out, unpack_inp, unpack_out
from random import choice
from subprocess import *
from buffer import Input, Nonce, Output, Sig
from user import User, UserList

getcontext().prec = 9

#This is a class which holds all the data for a coinjoin.  The CoinJoin has two main states that it can be in:  collecting utxo inputs and collecting
#signatures.  



class JoinState:
    current_id = 0

    def __init__(self, connect_limit:int = DEFAULT_LOWER_USER_BOUND, assetID:str = AVAX_FUJI_ID, assetamount = 1, 
            feeaddress:str = "", feepercent = 0.10, networkID = FUJI, debug_mode: bool = False):

        
        self.id = JoinState.current_id
        self.connect_limit = connect_limit
        self.assetID = assetID
        self.assetamount = assetamount
        self.feepercent = feepercent
        self.totalamount = assetamount + assetamount * feepercent
        self.feeaddress = feeaddress
        self.state = COLLECT_INPUTS
        self.networkID = networkID
        self.last_accessed = time.time()
        self.utx = None
        self.stx = None
        self.stx_id = None
        self.users = UserList()
        self.IP_addresses = []
        self.connections = []
        self.blacklist = []
        self.debug_mode = debug_mode

        if not self.isvalid_join():
            raise Exception("bad parameters")

        JoinState.current_id += 1

    #Returns the number of connections that have joined during the input stage
    def get_current_input_count(self):
        return self.users.get_num_inputs()

    #Returns the number of signatures that have joined during the signature stage
    def get_current_signature_count(self):
        return self.users.get_num_signatures()

    #function that returns the current status of the join in json form, for easy access
    def get_status(self):
        asset_name = convert_to_asset_name(self.assetID)
        status = {       
            "id": self.id,
            "asset_name": asset_name,
            "state": self.state,
            "input_limit": self.connect_limit,
            "base_amount": self.assetamount,
            "fee_percent":  self.feepercent,
            "total_amount": self.totalamount,
            "last_accessed": self.last_accessed
            }
        if self.state == COLLECT_INPUTS:
            status["current_input_count"] = self.get_current_input_count()
        elif self.state == COLLECT_SIGS:
            status["current_input_count"] = self.get_current_signature_count(),
        else:
            Exception("bad")
        return status

    #returns the value of the fee after burning the minimum avax amount
    def get_fee_after_burn(self):
        return float(self.get_collected_fee_amt() - Decimal(STANDARD_BURN_AMOUNT))

    def get_all_inputs(self):
        return self.users.get_all_inputs()

    #returns only the output data, not the ip addresses, from the output list
    def get_all_outputs(self):
        return self.users.get_all_outputs()

    #returns only the signatures from the signature list, not the public addresses associated with them
    def get_all_sigs(self):
        return self.users.get_all_sigs()

    def get_collected_fee_amt(self):
        return self.users.get_total_fee_amount()

    def remove_connection(self, conn):
        return self.connections.pop(self.connections.index(conn))

    #resets the join back to its base state
    def reset_join(self):
        self.state = COLLECT_INPUTS
        self.last_accessed = time.time()
        self.utx = None
        self.stx = None
        self.stx_id = None
        self.pubaddresses = []
        self.pending_users = []
        self.IP_addresses = []
        self.connections = []
        self.sigs = []
        self.inputs = []
        self.outputs = []
        self.blacklist = []

    #updates when the join was last accessed
    def update_last_accessed(self):
        self.last_accessed = time.time()

    #error checking when creating joins, check if parameters are valid
    def isvalid_join(self):
        if type(self.id) != int:
            return False
        if not self.debug_mode and (self.connect_limit < MIN_USER_BOUND or self.connect_limit > MAX_USER_BOUND):
            return False
        if self.assetamount <= 0:
            return False
        if self.feepercent < 0 or self.feepercent >= 1:
            return False
        return True
        
        

    #extracts inputs from request data
    def extract_inputbuf(request_data):
        return request_data["inputbuf"]

    #extracts outputs from request data
    def extract_outputbuf(request_data):
        return request_data["outputbuf"]

    #extracts the public address from request data
    def extract_pubaddr(request_data):
        return request_data["pubaddr"]

    def extract_ticket(request_data):
        return request_data["ticket"]

    #determines if the given public address has request a nonce from the cj
    def in_pending_users(self, pubaddr):
        if self.pending_users == []:
            return False
        if self.get_pending_user_index(pubaddr) == -1:
            return False
        return True
    
    #closes all connections associated with the cj
    def close_all_connections(self):
        for item in self.connections:
            item.close()
        self.connections = []

    #sends a message to all connections
    def send_message_to_all(self, message):
        for item in self.connections:
            send_message(item, message)

    #sends an error messsage to all connections
    def send_errmessage_to_all(self, message):
        for item in self.connections:
            send_errmessage(item, message)

    #sets the cj to a fresh collect sigs state
    def set_to_collect_sigs(self):
        self.stx = None
        self.stx_id = None
        self.sigs = None
        self.state = COLLECT_SIGS


    def remove_user(self, pubaddr, blacklist = True):
        self.utx = None
        self.stx = None
        self.stx_id = None
        self.remove_pubaddr(pubaddr)
        self.remove_input(pubaddr)
        self.remove_output(pubaddr)
        self.sigs = []
        self.state == COLLECT_INPUTS
        if blacklist:
            self.blacklist.append(pubaddr)

        print(self.utx, self.stx, self.stx_id, self.pubaddresses, self.inputs, self.outputs, self.sigs, self.state)

    #Function that parses data, and makes sure that it is valid
    def process_request(self, request_data, conn, addr):
        ip = addr[0]
        pubaddr = JoinState.extract_pubaddr(request_data)
        messagetype = request_data["messagetype"]

        user = self.users.get_user(pubaddr)

        #if handling a nonce request
        if messagetype == REQUEST_NONCE:
            if self.users.user_awaiting_nonce(pubaddr):
                send_message(conn, "sending new nonce")
            nonce_msg = ''.join(choice(string.ascii_letters) for i in range(10))
            nonce = Nonce(nonce_msg)

            if not user:
                user = User(pubaddr)
                self.users.append(user)
            user.nonce = nonce
            send_nonce(conn, nonce)
            return

        #When handling a potential input
        elif messagetype == COLLECT_INPUTS:
            input_buf = JoinState.extract_inputbuf(request_data)
            output_buf = JoinState.extract_outputbuf(request_data)
            signed_message_buf = JoinState.extract_ticket(request_data)
            
            try:
                input = Input(input_buf)
                output = Output(output_buf)
                user.nonce.parse_nonce(signed_message_buf, self.networkID)
            except Exception:
                send_errmessage(conn, "could not read input/output data or nonce")
                return

            if user:
                if user.nonce.nonce_addr == user.pubaddr:
                    if self.state == COLLECT_INPUTS:
                        if user.pubaddr == input.pubaddr:
                            if input.assetID == output.assetID == self.assetID:
                                if True: #not ip in self.IP_addresses:       #XXX need to comment out for testing purposes
                                    if input.amt >= self.totalamount and output.amt == self.assetamount:
                                        if not self.users.check_repeat_output_addr(output.output_addr):
                                            #create input and output data when this has been determined to be valid information
                                            self.update_last_accessed()
                                            self.connections.append(conn)
                                            self.IP_addresses.append(ip)
                                            user.remove_nonce()
                                            user.input = input
                                            user.output = output
                                            user.in_join = True

                                            print("collected fees: " + str(float((self.get_collected_fee_amt()))))
                                            send_message(conn, "transaction data accepted, please wait for other users to input data")

                                            for item in self.connections:
                                                send_message(item, "%d out of %d users connected" % (self.get_current_input_count(), self.connect_limit))
                                            
                                            #when sufficient connections are created, go through the process of sending out the transaction
                                            if self.get_current_input_count() >= self.connect_limit:
                                                #add the fee to the outputs
                                                try: 
                                                    self.utx = self.craft_utx()
                                                except Exception:
                                                    self.send_errmessage_to_all("bad unsigned transaction data.  Send input again")
                                                    self.reset_join()
                                                    return
                                                self.users.sort_users()
                                                #send out transaction to every user
                                                for item in self.connections:
                                                    send_message(item, "all transactions complete, please input signature now")
                                                    send_wiretx(item, self.utx)
                                                self.close_all_connections()
                                                self.IP_addresses = [] #delete ip addresses for security
                                                self.state = COLLECT_SIGS
                                            return
                                        else:
                                            print("nonce did not verify to pubaddr")
                                            send_errmessage(conn, "signature not associated with pubkey")
                                            return
                                    else:
                                        print("Quantity of avax needs to be the same")
                                        send_errmessage(conn, "Quantity of inputs/outputs needs to match")
                                        return
                                else:
                                    print("matching ip address already in use")
                                    send_errmessage(conn, "matching ip address already in use")
                                    return
                            else:
                                print("Mismatched asset-type")
                                send_errmessage(conn, "Mismatched asset-type")
                                return
                        else:
                            print("output does not belong to user")
                            send_errmessage(conn, "The output selected does not belong to the pubaddr used")
                            return
                    else:
                        print("message not applicable, Join in input state")
                        send_errmessage(conn, "Message not applicable, join not in input state")

                        return
                else:
                    print("nonce did not verify to pubaddr")
                    send_errmessage(conn, "signature not associated with pubkey")

                    return
            else:
                print("user not found")
                send_errmessage(conn, "could not find user, make sure to request a nonce to initialize with the CJ")

        #handles potential signature
        elif messagetype == COLLECT_SIGS:
            try:
                sig = Sig(self.utx, request_data["signature"], self.networkID)
            except Exception:
                send_errmessage(conn, "could not parse signature")

            if self.state == COLLECT_SIGS:
                if user and user.in_join == True:
                    if user.signature == None:
                        if user.pubaddr == sig.sig_addr:
                            #When it has been determined that the signature is valid, continue through
                            self.update_last_accessed()
                            user.signature = sig
                            self.connections.append(conn)
                            send_message(conn, "signature registered, waiting for others in the coinjoin")

                            for item in self.connections:
                                send_message(item, "%d out of %d users signed" % (self.get_current_signature_count(), self.connect_limit))

                            if self.get_current_signature_count() == self.connect_limit:
                                print("all signed")

                                try:
                                    self.stx = self.craft_stx()
                                except Exception:
                                    print("transaction didn't form properly")
                                    self.send_errmessage_to_all("transaction didn't form properly, send signature again")
                                    self.set_to_collect_sigs()
                                    return

                                timeout = 5000
                                for item in self.connections:
                                    send_message(item, "all participants have signed, submitting to blockchain")
                                    send_signedtx(item, {"stx": self.stx, "timeout": timeout})
                                    timeout += 100

                                status_data = self.issue_stx()
                                if status_data["status"] == "Accepted":
                                    print("transaction accepted")
                                    for item in self.connections:
                                        send_message(item, "tx accepted onto blockchain")
                                        send_accepted_txid(item, status_data["id"])
                                elif status_data["status"] == "Rejected":
                                    print("tx not accepted onto the blockchain")
                                    self.send_message_to_all("tx was not accepted onto blockchain")
                                self.close_all_connections()
                                self.reset_join()
                                return
                            return
                        else:
                            print("signature does not belong to pubaddr")
                            send_errmessage(conn, "this signature does not belong to the public key provided")
                    else:
                        print("already signed")
                        send_errmessage(conn, "already signed")
                        return
                else:
                    print("join is full")
                    send_errmessage(conn, "Join is full, already in signing state")
                    return
            else:
                print("not a message for signature state")
                send_errmessage(conn, "Message not applicable, join not in signature state")
                return

        #handles wiretx request
        elif messagetype == REQUEST_WTX:
            if self.state == COLLECT_SIGS:
                if user and user.in_join:
                    print("sending wiretx to participant")
                    send_message(conn, "sending wiretx information over")
                    send_wiretx(conn, self.utx)
                    return
                else:
                    print("not part of join, cannot request wiretx")
                    send_errmessage(conn, "not part of join, canont request wiretx")
                    return
            else:
                print("not in collect sigs, cannot send wiretx")
                send_errmessage(conn, "cannot send wiretx, join not in collectsigs state")
                return

        elif messagetype == EXIT:

            signed_message_buf = JoinState.extract_ticket(request_data)

            try:
                user.nonce.parse_nonce(signed_message_buf, self.networkID)
            except Exception:
                

            if user and user.in_join:
                if user:
                    if self.verify_ticket(pubaddr, request_data["ticket"], self.get_pending_user_nonce(pubaddr)):
                        self.remove_from_pending(pubaddr)
                        print("removing user %s" % pubaddr)

                        message = "user has been removed from the CJ"
                        if self.state == COLLECT_SIGS:
                            message += ", moving from collect sigs state to collect inputs.  You will have to sign again.\r\n"

                        self.remove_user(pubaddr)
                        message += "%s out of %s users connected" % (self.get_current_input_count(), self.connect_limit)

                        self.send_message_to_all(message)
                        conn.close()
                        return
                    else:
                        print("cannot validate user, will not remove")
                        send_errmessage(conn, "validation failed, user will not be removed")
                        return
                else:
                    print("user didn't request a nonce beforehand, cannot validate")
                    send_errmessage(conn, "did not request a nonce for validation, user will not be removed")
                    return
            else:
                print("user not in CJ")
                send_errmessage(conn, "User cannot be removed because %s is not in the CJ" % pubaddr)
                return

        else:
            print("not in a valid state")
            send_errmessage(conn, "in invalid state")
            return

    def __str__(self):
        returnstring = ""
        status =  self.get_status()
        for item in status:
            returnstring += item + " = " + str(status[item]) + "\r\n"
        return returnstring