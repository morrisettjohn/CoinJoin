operate CoinJoin_server by accessing through commandline and putting ip address in place.

Operates based on two different states: Collecting inputs & collecting signatures. When collecting inputs, the server will wait and receive json data that contain information necessary for a transaction. Below is a sample: {
"joinid": "123", "messagetype": "input", "utxo": "0123456789abcdef0123456789abcdef", "utxooffset": 2, "assettype": 1, "assetamount": 10, "destinationaddr": "feec1", "key": "abc398" }

if this is valid data, the server accepts the connection and will keep accepting connections until it has hit its limit.
It then creates a transaction based on the above data. Then it asks to receive signature data.

In the collect_signatures state, the server will wait until all connections send their signature. Once this is done, the signature will be sent out into the blockchain.

DEPENDENCIES: pip install ecdsa pip install base58