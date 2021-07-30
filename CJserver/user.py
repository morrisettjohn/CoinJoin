class Buffer:

    def __init__(self,)

class InputBuf:

    def __init__(self, buffer):
        self.buffer = buffer

class OutputBuf:

    def __init__(self, buffer):
        self.buffer = buffer



class User:

    def __init__(self, pubaddr: str):
        self.pubaddr = pubaddr
        self.input = None
        self.output = None
        self.signature = None

class UserList:

    def __init__(self, users: list):
        self.userlist = users

    def get_pubaddr()