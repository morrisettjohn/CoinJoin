from buffer import *

class User:

    def __init__(self, pubaddr: str):
        self.pubaddr = pubaddr
        self.input = None
        self.output = None
        self.signature = None
        self.nonce = None
        self.in_join = False

    def get_input_buf(self):
        if not self.input:
            return None
        return self.input.rawbuffer

    def get_input_amount(self):
        if not self.input:
            return None
        return self.input.amt

    def get_input_assetid(self):
        if not self.input:
            return None
        return self.input.assetID

    def get_input_pubaddr(self):
        if not self.input:
            return None
        return self.input.pubaddr

    def pubaddr_matches_input(self):
        if not self.input:
            return None
        return self.get_input_pubaddr() == self.pubaddr

    def get_output_buf(self):
        if not self.output:
            return None
        return self.output.rawbuffer
    
    def get_output_amount(self):
        if not self.output:
            return None
        return self.output.amt

    def get_output_assetid(self):
        if not self.output:
            return None
        return self.output.assetID

    def get_output_addr(self):
        if not self.output:
            return None
        return self.output.output_addr

    def has_matching_assetIDs(self):
        if not (self.input and self.output):
            return None
        return self.get_output_assetid() == self.get_input_assetid()

    def awaiting_nonce(self):
        if self.nonce:
            return True
        return False

    def get_sig_buf(self):
        if not self.signature:
            return None
        return self.signature.rawbuffer

    def get_sig_addr(self):
        if not self.signature:
            return None
        return self.signature.sig_addr

    def pubaddr_matches_sig(self):
        if not self.signature:
            return None
        return self.get_sig_addr() == self.pubaddr

    def remove_nonce(self):
        self.nonce = None

    def __str__(self):
        return self.pubaddr
    
class UserList:

    def __init__(self, users: list = []):
        self.userlist = users

    def sort_users(self):
        self.remove_non_input_users()
        self.userlist = sorted(self.userlist, key=lambda x:x.get_input_buf()["data"])

    def get_all_inputs(self):
        inputs = []
        for user in self.userlist:
            inputs.append(user.input.rawbuffer)
        return inputs

    def get_all_outputs(self):
        outputs = []
        for user in self.userlist:
            outputs.append(user.output.rawbuffer)
        return outputs

    def reset_list(self):
        self.userlist = []

    def remove_user(self, pubaddr):
        user = self.get_user(pubaddr)
        self.userlist.remove(user)
        return user

    def get_all_sigs(self):
        sigs = []
        for user in self.userlist:
            sigs.append(user.signature.sig)
        return sigs

    def remove_non_input_users(self):
        for item in self.userlist:
            if item.input == None:
                self.userlist.remove(item)

    def check_repeat_output_addr(self, output_addr):
        if self.userlist == []:
            return False
        for user in self.userlist:
            if user.output != None:
                if user.output.output_addr == output_addr:
                    return True
        return False

    def get_user(self, user: str):
        for item in self.userlist:
            if item.pubaddr == user:
                return item
        return None

    def has_user(self, user: str or User):
        x = self.get_user(user)
        if x:
            return True
        return False

    def user_has_signed(self, user_str: str):
        user = self.get_user(user_str)
        if user.signature != None:
            return True
        return False

    def user_awaiting_nonce(self, user_str):
        if self.has_user(user_str):
            user = self.get_user(user_str)
            if user.nonce:
                return True
            return False
        return False

    def append(self, user: User):
        self.userlist.append(user)

    def get_total_input_amount(self):
        return_val = Decimal(0)
        for item in self.userlist:
            return_val += item.get_input_amount()
        return return_val

    def get_total_output_amount(self):
        return_val = Decimal(0)
        for item in self.userlist:
            return_val += item.get_output_amount()
        return return_val

    def get_total_fee_amount(self):
        return self.get_total_input_amount() - self.get_total_output_amount()

    def get_num_inputs(self):
        return len(self.userlist)

    def get_num_signatures(self):
        num = 0
        for item in self.userlist:
            if item.signature != None:
                num += 1
        return num

    def all_users_signed(self):
        if self.get_num_inputs() == self.get_num_signatures():
            return True
        return False

    def __str__(self):
        return_string = ""
        for item in self.userlist:
            return_string += str(item) + ", "
        return return_string

