#Class which creates a specific join, and handles all requests for the specific join

from assetinfo import AVAX_FUJI_ID, convert_to_asset_name
import json
import subprocess
import time
import string
import traceback

from assetinfo import *
from messages import send_err, send_message, send_stx, send_wtx, send_accepted_tx_ID, send_nonce, send_log_confirmation
from utils.httprequest import *
from params import *
from struct import *
from utils.bufferutils import convert_to_jsbuffer
from random import choice
from subprocess import *
from datatypes import Input, Nonce, Output, Sig
from user import User, UserList
from config import *

#Given the specified fee key in config, generates a keypair for the server to use
def get_address(network_ID):
    pub_addr_data = str.encode(json.dumps({
        "private_key": FEE_KEY,
        "network_ID": network_ID
    }))

    result = subprocess.run(['node', './js_scripts/generatepubaddr.js'], input = pub_addr_data, capture_output=True)
    result.check_returncode()
    result_data = json.loads(bytes.decode((result.stdout)))
    return result_data

#generates the specific join tx id for the specified join
def generate_join_tx_ID():
    join_tx_ID = time.time_ns()//1000000
    time.sleep(0.001)
    return join_tx_ID

#Main joinstate class
class JoinState:
    current_id = 0
    completed_join_txs = 0
    fee_pub_addr = ""
    fee_priv_key = ""

    def __init__(self, threshold:int = DEFAULT_LOWER_USER_BOUND, asset_ID:str = AVAX_FUJI_ID, out_amount = 1, 
            fee_percent = 0.10, network_ID = FUJI, debug_mode: bool = False):

        JoinState.update_address(network_ID)
            
        self.ID = JoinState.current_id
        self.network_ID = network_ID
        self.threshold = threshold
        self.asset_ID = asset_ID
        self.fee_percent = fee_percent
        self.out_amount = out_amount
        self.inp_amount = self.out_amount + self.out_amount * self.fee_percent
        self.fee_address = JoinState.fee_pub_addr
        self.fee_key = JoinState.fee_priv_key
        self.state = COLLECT_INPUTS
        self.network_ID = network_ID
        self.join_tx_ID = generate_join_tx_ID()
        self.last_accessed = time.time()
        self.wtx = None
        self.stx = None
        self.stx_id = None
        self.users = UserList()
        self.IP_addrs = []
        self.cons = []
        self.blacklist = []
        self.debug_mode = debug_mode

        if not self.is_valid_join():
            raise Exception("bad parameters")

        JoinState.current_id += 1

    #Determines if the current address needs to be updated, and if so, generates a new address
    def update_address(network_ID):
        if JoinState.fee_pub_addr == "" or JoinState.completed_join_txs == GENERATE_NEW_ADDRESS_NUM:
            key_data = get_address(network_ID)
            
            print("switching to address: " + key_data["pub_addr"])
            JoinState.fee_pub_addr = key_data["pub_addr"]
            JoinState.fee_priv_key = key_data["priv_key"]

    #Returns the number of cons that have joined during the input stage
    def get_current_input_count(self):
        return self.users.get_num_inputs()

    #Returns the number of signatures that have joined during the signature stage
    def get_current_sig_count(self):
        return self.users.get_num_sigs()

    #function that returns the current status of the join in json form, for easy access
    def get_status(self):
        asset_name = convert_to_asset_name(self.asset_ID)

        status = {       
            "ID": self.ID,
            "asset_name": asset_name,
            "asset_ID": self.asset_ID,
            "network_ID": self.network_ID,
            "state": self.state,
            "input_limit": self.threshold,
            "input_amount": float(self.inp_amount),
            "output_amount": float(self.out_amount),
            "fee_percent":  float(self.fee_percent),
            "join_tx_ID": self.join_tx_ID,
            "fee_addr": self.fee_address,
            "last_accessed": self.last_accessed
            }

        if self.state == COLLECT_INPUTS:
            status["current_input_count"] = self.get_current_input_count()
        elif self.state == COLLECT_SIGS:
            status["current_input_count"] = self.get_current_sig_count(),
        else:
            Exception("bad")
        return status

    #returns the total fee amount collected
    def get_collected_fee_amt(self):
        return self.users.get_total_fee_amount()

    #returns the value of the fee after burning the minimum avax amount
    def get_fee_after_burn(self):
        return self.get_collected_fee_amt() - STANDARD_BURN_AMOUNT

    #returns all inputs that users have submitted
    def get_all_inputs(self):
        return self.users.get_all_inputs()

    #returns all outputs that users have submitted
    def get_all_outputs(self):
        return self.users.get_all_outputs()

    #returns all signatures that users have submitted
    def get_all_sigs(self):
        return self.users.get_all_sigs()

    #removes a given connection from a list
    def remove_connection(self, conn):
        try:
            conn.close()
        except Exception:
            pass
        return self.cons.pop(self.cons.index(conn))

    #resets the join back to its base state
    def reset_join(self):
        JoinState.completed_join_txs += 1
        JoinState.update_address(self.network_ID)
        
        self.state = COLLECT_INPUTS
        self.join_tx_ID = generate_join_tx_ID()
        self.fee_address = JoinState.fee_pub_addr
        self.fee_key = JoinState.fee_priv_key
        self.last_accessed = time.time()
        self.wtx = None
        self.stx = None
        self.stx_id = None
        self.IP_addrs = []
        self.cons = []
        self.users.reset_list()

    #updates when the join was last accessed
    def update_last_accessed(self):
        self.last_accessed = time.time()

    #error checking when creating joins, check if parameters are valid
    def is_valid_join(self):
        if type(self.ID) != int:
            return False
        if not self.debug_mode and (self.threshold < MIN_USER_BOUND or self.threshold > MAX_USER_BOUND):
            return False
        if self.out_amount <= 0:
            return False
        if self.fee_percent < 0 or self.fee_percent >= 1:
            return False
        return True

    #extracts the half of the nonce the server signs that the client generates
    def extract_server_nonce(request_data):
        return request_data["server_nonce"]
        
    #extracts inputs from request data
    def extract_input_buf(request_data):
        return request_data["input_buf"]

    #extracts outputs from request data
    def extract_output_buf(request_data):
        return request_data["output_buf"]

    #extracts the public address from request data
    def extract_pub_addr(request_data):
        return request_data["pub_addr"]

    #extracts the nonce from the request data
    def extract_nonce(request_data):
        return request_data["nonce"]

    #xtracts the signed nonce from the request data
    def extract_nonce_sig(request_data):
        return request_data["nonce_sig"]
    
    #generates a random nonce using characters a-z and A-Z
    def generate_nonce():
        return ''.join(choice(string.ascii_letters) for i in range(NONCE_LENGTH))

    #closes all cons associated with the cj
    def close_all_cons(self):
        for item in self.cons:
            item.close()
        self.cons = []

    #sends a message to all cons
    def send_message_to_all(self, message):
        for item in self.cons:
            send_message(item, message)

    #sends an error messsage to all cons
    def send_err_to_all(self, message):
        for item in self.cons:
            send_err(item, message)

    #sets the cj to a fresh collect sigs state
    def set_to_collect_sigs(self):
        self.stx = None
        self.stx_id = None
        self.sigs = None
        self.state = COLLECT_SIGS

    #calls a subprocess that crafts the wire transaction from the collected data
    def craft_wtx(self):
        fee_data = {
            "asset_ID": self.asset_ID, 
            "amount": self.get_fee_after_burn()*BNSCALE, 
            "address": self.fee_address
        }

        wtx_data = str.encode(json.dumps({
            "inputs": self.get_all_inputs(),
            "outputs": self.get_all_outputs(),
            "network_ID": self.network_ID,
            "fee_data": fee_data
        }))

        result = subprocess.run(['node', './js_scripts/craftunsignedtx.js'], input = wtx_data, capture_output=True)
        result.check_returncode()
        wtx_buf = convert_to_jsbuffer(result.stdout)
        return wtx_buf

    #calls a subprocess that returns the raw buffer data for a signed transaction
    def craft_stx(self):
        stx_data = str.encode(json.dumps({
            "sigs": self.get_all_sigs(),
            "wtx": self.wtx,
        }))

        result = subprocess.run(['node', './js_scripts/craftsignedtx.js'], input = stx_data, capture_output=True)
        result.check_returncode()
        stx_buf = convert_to_jsbuffer(result.stdout)
        return stx_buf

    #calls a subprocess that issues the data
    def issue_stx(self):
        issue_data = str.encode(json.dumps({
            "stx": self.stx,
            "network_ID": self.network_ID
        }))

        result = subprocess.run(['node', './js_scripts/issuestx.js'], input = issue_data, capture_output=True)
        result.check_returncode()
        result_data = json.loads(bytes.decode((result.stdout)))
        return result_data

    #cals a subprocess that signs the nonce that verifies the server's address
    def sign_server_nonce(self, server_nonce):
        server_sign_data = str.encode(json.dumps({
            "server_nonce": server_nonce,
            "priv_key": self.fee_priv_key,
            "network_ID": self.network_ID
        }))

        result = subprocess.run(['node', './js_scripts/signservernonce.js'], input = server_sign_data, capture_output=True)
        result.check_returncode()
        result_data = json.loads(bytes.decode((result.stdout)))
        return result_data["server_sig"]

    #removes a user from the user list
    def remove_user(self, pub_addr, blacklist = True):
        self.wtx = None
        self.stx = None
        self.stx_id = None
        self.users.remove_user(pub_addr)
        self.users.remove_all_sigs()
        self.state == COLLECT_INPUTS
        if blacklist:
            self.blacklist.append(pub_addr)

    #Function that parses data, and makes sure that it is valid
    def process_request(self, request_data, conn, addr):
        ip = addr[0]
        pub_addr = JoinState.extract_pub_addr(request_data)
        message_type = request_data["message_type"]
        user = self.users.get_user(pub_addr)

        # Handles a nonce request.  Used for verifying that the client owns the public address provided, 
        # and the server owns the public address they claim.

        # Flow:  The client and the server send each other randomly generated 5 character nonces.  In order to verify
        # that the message is not the hash of one of their own messages, both the server and client append 5 more randomly
        # generated characters, and then both sides send the completed nonce and signature to each other.  If the message
        # begins with the provided 5-character sequence, and the nonce and nonce signature can be verified to belong to
        # the provided public address, both the client and server can verify that the other side actually has the private key
        # to the public address they claim to have.
        if message_type == REQUEST_NONCE:
            #if a user has already requested a nonce, send them back a new nonce
            if self.users.user_awaiting_nonce(pub_addr):
                send_message(conn, "sending new nonce")

            #nonce information that the server must sign
            server_nonce = JoinState.extract_server_nonce(request_data)
            server_nonce += JoinState.generate_nonce()
            server_sig = self.sign_server_nonce(server_nonce)

            #nonce information that the client must use
            nonce_msg = JoinState.generate_nonce()
            client_nonce = Nonce(nonce_msg)

            if not user:
                user = User(pub_addr)
                self.users.append(user)
            user.nonce = client_nonce

            nonce_verification_data = {
                "nonce": client_nonce.msg, 
                "server_nonce": server_nonce, 
                "server_sig": server_sig, 
                "server_pub_addr": self.fee_address
            }
            send_nonce(conn, nonce_verification_data)
            return

        #verifies the legitimacy of an input a user sends, and if true, adds them to the join.
        elif message_type == COLLECT_INPUTS:
            input_buf = JoinState.extract_input_buf(request_data)
            output_buf = JoinState.extract_output_buf(request_data)
            nonce = JoinState.extract_nonce(request_data)
            nonce_sig = JoinState.extract_nonce_sig(request_data)

            try:
                #try to construct the user's input/output data as well as their nonce verification data
                input = Input(input_buf, self.network_ID)
                output = Output(output_buf, self.network_ID)
                user.nonce.parse_nonce(nonce, nonce_sig, self.network_ID)
            except Exception:
                print("couldn't read input/output data")
                traceback.print_exc()
                send_err(conn, "could not read input/output data or nonce")
                return

            if user:
                if user.nonce.nonce_addr == user.pub_addr:
                    if self.state == COLLECT_INPUTS:
                        if user.pub_addr == input.pub_addr:
                            if user.pub_addr != output.output_addr:
                                if input.asset_ID == output.asset_ID == self.asset_ID:
                                    if True: #not ip in self.IP_addrs:       #XXX need to comment out for testing purposes
                                        if input.amt == self.inp_amount and output.amt == self.out_amount:
                                            if not self.users.check_repeat_output_addr(output.output_addr):

                                                #create input and output data when this has been determined to be valid information
                                                self.update_last_accessed()
                                                self.cons.append(conn)
                                                self.IP_addrs.append(ip)
                                                user.remove_nonce()
                                                user.input = input
                                                user.output = output
                                                user.in_join = True

                                                print("collected fees: " + str(float((self.get_collected_fee_amt()))))
                                                send_message(conn, "transaction data accepted, please wait for other users to input data")

                                                for item in self.cons:
                                                    #whenever a user inputs a data, tell all users about a new input
                                                    send_message(item, "%d out of %d users connected" % (self.get_current_input_count(), self.threshold))
                                                
                                                #if the number of connections is equal to the threshold, construct the wtx and move to the collect sigs state
                                                if self.get_current_input_count() >= self.threshold:
                                                    try: 
                                                        self.wtx = self.craft_wtx()
                                                    except Exception:
                                                        print("bad unsigned transaction")
                                                        traceback.print_exc()
                                                        self.send_err_to_all("bad unsigned transaction data.  Send input again")
                                                        self.reset_join()
                                                        return
                                                    self.users.sort_users()
                                                    #send out transaction to every user
                                                    for item in self.cons:
                                                        send_message(item, "all transactions complete, please input signature now")
                                                        send_wtx(item, self.wtx)
                                                    self.close_all_cons()
                                                    self.IP_addrs = [] #delete ip addresses for security
                                                    self.state = COLLECT_SIGS
                                                return
                                            else:
                                                print("repeated address")
                                                send_err(conn, "cannot send to this user")
                                                return
                                        else:
                                            print("Quantity of avax needs to be the same")
                                            send_err(conn, "Quantity of inputs/outputs needs to match")
                                            return
                                    else:
                                        print("matching ip address already in use")
                                        send_err(conn, "matching ip address already in use")
                                        return
                                else:
                                    print("Mismatched asset-type")
                                    send_err(conn, "Mismatched asset-type")
                                    return
                            else:
                                print("cannot send to self")
                        else:
                            print("output does not belong to user")
                            send_err(conn, "The output selected does not belong to the pub_addr used")
                            return
                    else:
                        print("message not applicable, Join in input state")
                        send_err(conn, "Message not applicable, join not in input state")
                        return
                else:
                    print("nonce did not verify to pub_addr")
                    send_err(conn, "signature not associated with pubkey")
                    return
            else:
                print("user not found")
                send_err(conn, "could not find user, make sure to request a nonce to initialize with the CJ")

        #verifies the legitimacy of a signature, and then once all signatures are collected issue the tx
        elif message_type == COLLECT_SIGS:

            try:
                #try to construct the signature from the provided data.
                sig = Sig(self.wtx, request_data["sig"], self.network_ID)
            except Exception:
                print("couldn't parse signature")
                traceback.print_exc()
                send_err(conn, "could not parse signature")
                return

            if self.state == COLLECT_SIGS:
                if user and user.in_join == True:
                    if user.sig == None:
                        if user.pub_addr == sig.sig_addr:
                            #When it has been determined that the signature is valid, add the signature to the user's data
                            self.update_last_accessed()
                            user.sig = sig
                            self.cons.append(conn)
                            send_message(conn, "signature registered, waiting for others in the coinjoin")

                            for item in self.cons:
                                #update users on the number of signatures provided
                                send_message(item, "%d out of %d users signed" % (self.get_current_sig_count(), self.threshold))

                            #if the number of signatures reaches the threshold reached, construct the tx and issue
                            if self.get_current_sig_count() == self.threshold:
                                print("all signed")
                                try:
                                    self.stx = self.craft_stx()
                                except Exception:
                                    print("transaction didn't form properly")
                                    traceback.print_exc()
                                    self.send_err_to_all("transaction didn't form properly, send signature again")
                                    self.set_to_collect_sigs()
                                    return

                                timeout = 5000
                                for item in self.cons:
                                    #send the signed transaction and the timeout counter if the server fails to issue in a timely manner
                                    send_message(item, "all participants have signed, submitting to blockchain")
                                    send_stx(item, {"stx": self.stx, "timeout": timeout})
                                    timeout += 100

                                status_data = self.issue_stx()
                                if status_data["status"] == "Accepted":
                                    print("transaction accepted")
                                    for item in self.cons:
                                        send_message(item, "tx accepted onto blockchain")
                                        send_accepted_tx_ID(item, status_data["ID"])
                                elif status_data["status"] == "Rejected":
                                    print("tx not accepted onto the blockchain")
                                    self.send_message_to_all("tx was not accepted onto blockchain")
                                self.close_all_cons()
                                self.reset_join()
                                print(self.users)
                                return
                            return
                        else:
                            print("signature does not belong to pub_addr")
                            send_err(conn, "this signature does not belong to the public key provided")
                    else:
                        print("already signed")
                        send_err(conn, "already signed")
                        return
                else:
                    print("join is full")
                    send_err(conn, "Join is full, already in signing state")
                    return
            else:
                print("not a message for signature state")
                send_err(conn, "Message not applicable, join not in signature state")
                return

        #Handles a request to get the wtx information from the join
        elif message_type == REQUEST_WTX:
            if self.state == COLLECT_SIGS:

                #verify that the user is in the join and they own the public key
                nonce = JoinState.extract_nonce(request_data)
                nonce_sig = JoinState.extract_nonce_sig(request_data)

                try:
                    user.nonce.parse_nonce(nonce, nonce_sig, self.network_ID)
                except Exception:
                    print("couldn't parse nonce for exit")
                    traceback.print_exc()
                    send_err(conn, "could not parse nonce")
                    return

                if user and user.in_join:
                    if user.nonce.nonce_addr == user.pub_addr:
                        #if the user is in the join, send the wtx data
                        print("sending wtx to participant")
                        send_message(conn, "sending wtx information over")
                        send_wtx(conn, self.wtx)
                        return
                    else:
                        print("nonce did not validate to the public address provided")
                        send_err(conn, "validation failed, cannot send wtx")
                        return
                else:
                    print("not part of join, cannot request wtx")
                    send_err(conn, "not part of join, cann0t request wtx")
                    return
            else:
                print("not in collect sigs, cannot send wtx")
                send_err(conn, "cannot send wtx, join not in collectsigs state")
                return

        #handles a case where a user wants to exit the cj
        elif message_type == EXIT:

            #verify that the user is actually in the join and owns the public key
            nonce = JoinState.extract_nonce(request_data)
            nonce_sig = JoinState.extract_nonce_sig(request_data)

            try:
                user.nonce.parse_nonce(nonce, nonce_sig, self.network_ID)
            except Exception:
                print("couldn't parse nonce for exit")
                traceback.print_exc()
                send_err(conn, "could not parse nonce")
                return

            if user and user.in_join:
                if user.nonce != None:
                    if user.nonce.nonce_addr == user.pub_addr:
                        #if the user is in the join and verifies to the public address, remove them from the join
                        print("removing user %s" % pub_addr)
                        message = "user has been removed from the CJ"
                        if self.state == COLLECT_SIGS:
                            message += ", moving from collect sigs state to collect inputs.  You will have to sign again.\r\n"

                        self.remove_user(pub_addr)

                        self.send_message_to_all(message)
                        self.send_message_to_all("%s out of %s users connected" % (self.get_current_input_count(), self.threshold))
                        conn.close()
                        return
                    else:
                        print("cannot validate user, will not remove")
                        send_err(conn, "validation failed, user will not be removed")
                        return
                else:
                    print("user didn't request a nonce beforehand, cannot validate")
                    send_err(conn, "did not request a nonce for validation, user will not be removed")
                    return
            else:
                print("user not in CJ")
                send_err(conn, "User cannot be removed because %s is not in the CJ" % pub_addr)
                return

        else:
            print("not in a valid state")
            send_err(conn, "in invalid state")
            return

    def __str__(self):
        return_string = ""
        status =  self.get_status()
        for item in status:
            return_string += item + " = " + str(status[item]) + "\r\n"
        return return_string