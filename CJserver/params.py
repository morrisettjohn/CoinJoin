
START_PROCESS, SELECT_OPTIONS, GET_JOIN_INFO, COLLECT_INPUTS, COLLECT_SIGS, DONE = range(6) #different states for a CoinJoin
JOIN_AMOUNTS = [1, 10, 100]
MIN_USER_BOUND = 3
MAX_USER_BOUND = 20
DEFAULT_LOWER_USER_BOUND = 5
DEFAULT_UPPER_USER_BOUND = 8
AVAX = "23wKfz3viWLmjWo2UZ7xWegjvnZFenGAVkouwQCeB9ubPXodG6"
ETHER = "2"
ASSET_TYPES = [AVAX]
REQUEST_TERMINATOR = b'\r\n\r\n'