
START_PROCESS, SELECT_OPTIONS, GET_JOIN_DATA, COLLECT_INPUTS, COLLECT_SIGS, ISSUE_TX, \
    REQUEST_WTX, REQUEST_NONCE, EXIT, GET_USER_LIST = range(10) #different states for a CoinJoin
MIN_USER_BOUND = 2
MAX_USER_BOUND = 20
DEFAULT_LOWER_USER_BOUND = 5
DEFAULT_UPPER_USER_BOUND = 8

FUJI = 5
MAINNET = 1

REQUEST_TERMINATOR = b'\r\n\r\n'
STANDARD_BURN_AMOUNT = 0.001
BNSCALE = 1000000000
NONCE_LENGTH = 5

OUTPUT_TYPE_ID = 7
TXID_BUF_LENGTH = 32
OUTPUTIDX_BUF_LENGTH = 4
ASSETID_BUF_LENGTH = 32
TYPEID_BUF_LENGTH = 4
ASSETAMOUNT_BUF_LENGTH = 8
SIGCOUNT_BUF_LENGTH = 4
SIGIDX_BUF_LENGTH = 4
LOCKTIME_BUF_LENGTH = 8
THRESHOLD_BUF_LENGTH = 4
NUMADDRESSES_BUF_LENGTH = 4
ADDRESS_BUF_LENGTH = 20


