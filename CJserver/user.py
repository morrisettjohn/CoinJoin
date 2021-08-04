from buffer import *

class User:

    def __init__(self, pub_addr: str):
        self.pub_addr = pub_addr
        self.input = None
        self.output = None
        self.sig = None
        self.nonce = None
        self.in_join = False

    def get_input_buf(self):
        if not self.input:
            return None
        return self.input.raw_buf

    def get_input_amount(self):
        if not self.input:
            return None
        return self.input.amt

    def get_input_asset_ID(self):
        if not self.input:
            return None
        return self.input.asset_ID

    def get_input_pub_addr(self):
        if not self.input:
            return None
        return self.input.pub_addr

    def get_output_buf(self):
        if not self.output:
            return None
        return self.output.raw_buf
    
    def get_output_amount(self):
        if not self.output:
            return None
        return self.output.amt

    def get_output_asset_ID(self):
        if not self.output:
            return None
        return self.output.asset_ID

    def get_output_addr(self):
        if not self.output:
            return None
        return self.output.output_addr

    def remove_sig(self):
        self.sig = None

    def awaiting_nonce(self):
        if self.nonce:
            return True
        return False

    def get_sig_buf(self):
        if not self.sig:
            return None
        return self.sig.raw_buf

    def get_sig_addr(self):
        if not self.sig:
            return None
        return self.sig.sig_addr

    def pub_addr_matches_sig(self):
        if not self.sig:
            return None
        return self.get_sig_addr() == self.pub_addr

    def remove_nonce(self):
        self.nonce = None

    def __str__(self):
        return self.pub_addr
    
class UserList:

    def __init__(self):
        self.user_list = []

    def sort_users(self):
        self.remove_non_input_users()
        self.user_list = sorted(self.user_list, key=lambda x:x.get_input_buf()["data"])

    def get_all_inputs(self):
        inputs = []
        for user in self.user_list:
            inputs.append(user.input.raw_buf)
        return inputs

    def remove_all_sigs(self):
        for user in self.user_list:
            user.remove_sig()

    def get_all_outputs(self):
        outputs = []
        for user in self.user_list:
            outputs.append(user.output.raw_buf)
        return outputs

    def reset_list(self):
        self.user_list = []

    def remove_user(self, pub_addr):
        user = self.get_user(pub_addr)
        self.user_list.remove(user)
        return user

    def get_all_sigs(self):
        sigs = []
        for user in self.user_list:
            sigs.append(user.sig.sig)
        return sigs

    def remove_non_input_users(self):
        for item in self.user_list:
            if item.input == None:
                self.user_list.remove(item)

    def check_repeat_output_addr(self, output_addr):
        if self.user_list == []:
            return False
        for user in self.user_list:
            if user.output != None:
                if user.output.output_addr == output_addr:
                    return True
        return False

    def get_user(self, user: str):
        for item in self.user_list:
            if item.pub_addr == user:
                return item
        return None

    def has_user(self, user: str):
        x = self.get_user(user)
        if x:
            return True
        return False

    def user_has_signed(self, user_str: str):
        user = self.get_user(user_str)
        if user.sig != None:
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
        self.user_list.append(user)

    def get_total_input_amount(self):
        return_val = Decimal(0)
        for item in self.user_list:
            return_val += item.get_input_amount()
        return return_val

    def get_total_output_amount(self):
        return_val = Decimal(0)
        for item in self.user_list:
            return_val += item.get_output_amount()
        return return_val

    def get_total_fee_amount(self):
        return self.get_total_input_amount() - self.get_total_output_amount()

    def get_num_inputs(self):
        return len(self.user_list)

    def get_num_sigs(self):
        num = 0
        for item in self.user_list:
            if item.sig != None:
                num += 1
        return num

    def all_users_signed(self):
        if self.get_num_inputs() == self.get_num_sigs():
            return True
        return False

    def __str__(self):
        return_string = ""
        for item in self.user_list:
            return_string += str(item) + ", "
        return return_string