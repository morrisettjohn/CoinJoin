CONNECT_LIMIT_MAX = 200 #limit for the number of connections a join can have
COLLECT_INPUTS, COLLECT_SIGS, DONE = range(3) #different states for a CoinJoin
JOIN_AMOUNTS = [1, 10, 100]
AVAX, ETHER = range(1, 3)
ASSET_TYPES = [AVAX]
REQUEST_TERMINATOR = b'\r\n\r\n'