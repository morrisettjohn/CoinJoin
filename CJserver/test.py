import hashlib

msg = "1"

test = hashlib.sha256(msg.encode())
btest = test.digest()
print(btest)