#classes which contain information about a user during a join transaction

from datatypes import *

class User:

    def __init__(self, pub_addr: str):
        self.pub_addr = pub_addr
        self.input = None
        self.output = None
        self.sig = None
        self.nonce = None
        self.in_join = False

    #returns the buffer of the input that the user provides
    def get_input_buf(self):
        if not self.input:
            return None
        return self.input.raw_buf

    #returns the amount of the input that the user provides
    def get_input_amount(self):
        if not self.input:
            return None
        return self.input.amt

    #returns the asset id for an input
    def get_input_asset_ID(self):
        if not self.input:
            return None
        return self.input.asset_ID

    #returns the public address for the input that the user provides
    def get_input_pub_addr(self):
        if not self.input:
            return None
        return self.input.pub_addr

    #returns the buffer of the output that the user provides
    def get_output_buf(self):
        if not self.output:
            return None
        return self.output.raw_buf
    
    #returns the amount that the user provides for their output
    def get_output_amount(self):
        if not self.output:
            return None
        return self.output.amt

    #returns the asset ID for the output that the user provides
    def get_output_asset_ID(self):
        if not self.output:
            return None
        return self.output.asset_ID

    #returns the address that the user's output will send to
    def get_output_addr(self):
        if not self.output:
            return None
        return self.output.output_addr

    #returns the buffer of the signed wtx that the user has created
    def get_sig_buf(self):
        if not self.sig:
            return None
        return self.sig.raw_buf

    #returns the signature of the user that the signed wtx has verified to
    def get_sig_addr(self):
        if not self.sig:
            return None
        return self.sig.sig_addr

    #returns true if the signature verifies to the user's public address
    def pub_addr_matches_sig(self):
        if not self.sig:
            return None
        return self.get_sig_addr() == self.pub_addr

    #removes the signature from a user's data
    def remove_sig(self):
        self.sig = None

    #determines if a user has requested a nonce for verification
    def awaiting_nonce(self):
        if self.nonce:
            return True
        return False

    #removes a nonce from the user's data
    def remove_nonce(self):
        self.nonce = None

    def __str__(self):
        return self.pub_addr
    
class UserList:

    def __init__(self):
        self.user_list = []

    #sorts all users based on their input data
    def sort_users(self):
        self.remove_non_input_users()
        self.user_list = sorted(self.user_list, key=lambda x:x.get_input_buf()["data"])

    #returns all the inputs that users have provided
    def get_all_inputs(self):
        inputs = []
        for user in self.user_list:
            if user.in_join:
                inputs.append(user.input.raw_buf)
        return inputs

    #returns all outputs that users have provided
    def get_all_outputs(self):
        outputs = []
        for user in self.user_list:
            if user.in_join:
                outputs.append(user.output.raw_buf)
        return outputs

    #returns all signatures that users have provided
    def get_all_sigs(self):
        sigs = []
        for user in self.user_list:
            if user.in_join:
                sigs.append(user.sig.sig)
        return sigs

    #remove all signatures from users' data
    def remove_all_sigs(self):
        for user in self.user_list:
            user.remove_sig()

    #remove all user data from the list
    def reset_list(self):
        self.user_list = []

    #remove a specific user from the list
    def remove_user(self, pub_addr):
        user = self.get_user(pub_addr)
        self.user_list.remove(user)
        return user

    #remove all users from the list that have not sent input/output data
    def remove_non_input_users(self):
        for item in self.user_list:
            if item.input == None or item.output == None:
                self.user_list.remove(item)

    #check if an output goes to an address that is an input address or another output address
    def check_repeat_output_addr(self, output_addr):
        if self.user_list == []:
            return False
        for user in self.user_list:
            if user.in_join:
                if user.output != None:
                    if user.output.output_addr == output_addr:
                        return True
                    if user.pub_addr == output_addr:
                        return True
        return False

    #returns the user data for a specified public address
    def get_user(self, user: str):
        for item in self.user_list:
            if item.pub_addr == user:
                return item
        return None

    #returns true if the user list has data related to a specific public address
    def has_user(self, user: str):
        x = self.get_user(user)
        if x:
            return True
        return False

    #returns true if the user has provided a signature
    def user_has_signed(self, user_str: str):
        user = self.get_user(user_str)
        if user.sig != None:
            return True
        return False

    #returns true if the user has requested a nonce
    def user_awaiting_nonce(self, user_str):
        if self.has_user(user_str):
            user = self.get_user(user_str)
            if user.nonce:
                return True
            return False
        return False

    #adds a user to the user list
    def append(self, user: User):
        self.user_list.append(user)

    #returns the total amount of currency that the inputs provide
    def get_total_input_amount(self):
        return_val = 0.0
        for item in self.user_list:
            return_val += item.get_input_amount()
        return round(return_val, 9)

    #returns the total amount of currency that the outputs provide
    def get_total_output_amount(self):
        return_val = 0.0
        for item in self.user_list:
            return_val += item.get_output_amount()
        return round(return_val, 9)

    #returns the collected fee amount that the server can collect
    def get_total_fee_amount(self):
        return round(self.get_total_input_amount() - self.get_total_output_amount(), 9)

    #returns the number of inputs that the server has collected
    def get_num_inputs(self):
        inputs = 0
        for user in self.user_list:
            if user.in_join:
                inputs += 1
        return inputs

    #returns the number of signatures that the server has collected
    def get_num_sigs(self):
        sigs = 0
        for item in self.user_list:
            if item.sig != None:
                sigs += 1
        return sigs

    #returns true if all users have signed
    def all_users_signed(self):
        if self.get_num_inputs() == self.get_num_sigs():
            return True
        return False

    def __str__(self):
        return_string = ""
        for item in self.user_list:
            return_string += str(item) + ", "
        return return_string