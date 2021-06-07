# Copright (C) 2018, Emin Gun Sirer

from optparse import OptionParser

from dag import DAG
from transaction import *
from node import Node
import utils
import messages

parser = OptionParser(version="0.0.1")
parser.add_option("-d", "--debug", action="store_true", dest="debug", help="Turn on debugging", default=False)
parser.add_option("-D", "--databasedir", action="store", dest="databasedir", help="Database for Ava transactions", default='db')
parser.add_option("-i", "--ip", action="store", dest="bindaddr", help="IP address to bind to", default='0.0.0.0')
parser.add_option("-p", "--port", action="store", dest="bindport", help="Port to bind to", default=Node.DEFAULT_PORT)
parser.add_option("", "--rpcip", action="store", dest="rpcaddr", help="IP address to bind to", default='127.0.0.1')
parser.add_option("", "--rpcport", action="store", dest="rpcport", help="Port to bind to", default=Node.DEFAULT_RPC_PORT)
parser.add_option("-s", "--seeds", action="store", dest="seeds", help="Initial set of nodes to connect to", default="")
parser.add_option("-t", "--testnet", action="store_true", dest="testnet", help="Connect to testnet", default=False)
(options, args) = parser.parse_args()

utils.log_setmyname("%s:%s" % (options.bindaddr, options.bindport))
messages.set_mynetwork("testnet" if options.testnet else "mainnet")

seeds = options.seeds.split(',') if options.seeds else []

dag = DAG(database_dir=options.databasedir)

k1 = make_key("/master/egs/0")  # set things up so egs's key will have some utxos in the database

# create genesis transaction
t0 = Transaction(None, [],
                 [TxOutput(packvalues=True, stype=PayTo_PubKeyHash, coinid=2, amount= 64, address=key_to_address(k1)),
                  TxOutput(packvalues=True, stype=PayTo_PubKeyHash, coinid=2, amount=128, address=key_to_address(k1)),
                  TxOutput(packvalues=True, stype=PayTo_PubKeyHash, coinid=2, amount=256, address=key_to_address(k1))])

log_debug("==========================================================")
log_debug("Node starting up with genesis vertex %s" % str(t0))
log_debug("==========================================================")
dag.insert(t0)

me = Node(dag=dag,
          ipaddr=options.bindaddr, port=int(options.bindport), 
          rpc_ipaddr=options.rpcaddr, rpc_port=int(options.rpcport), 
          peers=seeds)
me.run()

