# Copyright (C) 2018, Emin Gun Sirer
# See the file COPYING for details.

import binascii
import hashlib
from collections import defaultdict

from ecdsa import SigningKey, VerifyingKey, SECP256k1

from utils import *
from params import *

# For good hygiene, we employ a canonical format for all transaction inputs and outputs
# Both inputs and outputs are sorted by their respective keys

# Inputs explicitly contain information that is implicit in the txhash, such as coinid and amount.
# This is to help third parties write lightweight transaction processing software that does not
# need to also maintain a full copy of the UTXO set.

# This low level module will let you build any transaction you want. It will not check the 
# parameters against the DAG for sanity. No guarantee that the resulting transactions will 
# always be accepted by the network.

#this is just stuff for testing purposes
COINIDAVA = 1
CAPITALDE = 0
def current_epoch_id():
    return 10000



class BadTransaction(Exception):
    def __init__(self, reason):
        self.reason = reason

    def __str__(self):
        return "bad transaction: %s" % self.reason

TXVERSION=1000
# transaction types
PayTo_PubKeyHash, PayTo_Multisig, Stake, Unstake, MintReward = range(1,6)
spendstr = { PayTo_PubKeyHash: "PayTo_PubKeyHash", PayTo_Multisig: "PayTo_Multisig", Stake: "Stake", Unstake: "Unstake", MintReward: "MintReward"}

class TxOutput:
    # this constructor takes a buffer, typically a memoryview, and, optionally, a set of field values
    # 
    # it either interprets the contents of the buffer, or it packs the given field values into that buffer
    # if no buffer is provided, it will allocate its own buffer
    # locktime is measured according to Unix time, from the start of epoch in 1970
    def __init__(self, buf=None, packvalues=False, stype=0, coinid=0, amount=0, locktime=0.0, address=None, threshold=0, addresses=None, epoch=0):
        if buf is None and packvalues:
            baselen = 4 + 4 + 8 + 8
            if stype == PayTo_PubKeyHash or stype == Stake:
                fulllen = baselen + ADDRLEN
            elif stype == PayTo_Multisig:
                fulllen = baselen + 8 + ADDRLEN * len(addresses)
            else:
                raise BadTransaction("unknown type")
            buf = bytearray(fulllen)
        self.buf = buf
        if packvalues:
            off = 0
            off += pack_int(buf, off, stype)
            off += pack_int(buf, off, coinid)
            off += pack_long(buf, off, amount)
            if stype == PayTo_PubKeyHash:
                off += pack_double(buf, off, locktime)
                off += pack_addr(buf, off, address)
            elif stype == Stake:
                off += pack_long(buf, off, epoch)
                off += pack_addr(buf, off, address)
            elif stype == PayTo_Multisig:
                if threshold <= 0 or threshold >= len(addresses) or len(addresses) == 1:
                    raise BadTransaction("bad threshold and number of multisig addresses")
                off += pack_double(buf, off, locktime)
                off += pack_int(buf, off, self.threshold)
                off += pack_int(buf, off, len(addresses))
                for addr in sorted(addresses):
                    off += pack_addr(buf, off, addr)
            else:
                raise BadTransaction("unknown txout type")

    def size(self):
        baselen = 4 + 4 + 8 + 8
        return baselen + ADDRLEN if self.spendtype() == PayTo_PubKeyHash else baselen + 8 + ADDRLEN * len(self.addresses())

    def spendtype(self):
        return unpack_int(self.buf, 0)[1]

    def coinid(self):
        return unpack_int(self.buf, 4)[1]

    def amount(self):
        return unpack_long(self.buf, 8)[1]

    def locktime(self):       
        # the locktime representation must be identical in length to epoch representation
        return unpack_double(self.buf, 16)[1]
        
    def epoch(self):
        # the epoch representation must be identical in length to locktime representation
        return unpack_long(self.buf, 16)[1]
        
    def address(self):       
        return unpack_addr(self.buf, 24)[1]
        
    def threshold(self):
        return unpack_int(self.buf, 24)[1]

    def addresses(self):
        _, naddrs = unpack_int(self.buf, 20)
        off = 24
        addrs = []
        for i in range(naddrs):
            nlen, address  = unpack_addr(self.buf, off)
            off += nlen
            addrs.append(address)
        return addrs

    def __lt__(self, other):
        return self.address() < other.address()

    def is_valid(self):
        # check to make sure that there is room in the buffer 
        if len(self.buf) < 16:
            raise BadTransaction("txout too short")
        if self.spendtype() not in spendstr:
            raise BadTransaction("unknown output type")
        # XXX check that coinid is legitimate
        if self.spendtype() == PayTo_PubKeyHash:
            # XXX check to make sure that the output address has a valid checksum
            pass
        elif self.spendtype() == Stake:
            # handle stake
            # coinid must be Ava
            if self.coinid() != COINIDAVA:
                raise("trying to stake non-Ava coins")
            # epoch number must be no greater than +1 of the current epoch
            if self.epoch() > current_epoch_id() + 1:
                raise("trying to stake too far in the future")
            # amount must be greater than the staking amount
            if self.amount() < CAPITALDE:
                raise("insufficient stake amount")
        elif self.spendtype() == PayTo_Multisig:
            # XXX handle multisig
            pass
        return True

    def wire_representation(self):
        return self.buf

    def __str__(self):
        tstr = "TxOutput(type=%s, coinid=%d, amount=%d, address=%s)" % (spendstr[self.spendtype()], self.coinid(), self.amount(), address_to_ui(self.address()))
        return tstr

class TxInput:
    # 
    #
    # keys are a list of (idx, key) pairs
    def __init__(self, buf=None, packvalues=False, stype=0, prevhash=None, previdx=None, coinid=0, amount=0, key=None, threshold=0, keyidxs=[], keys=[]):
        if buf is None and packvalues:
            self.buf = buf = bytearray(4 + HASHLEN + 4 + 4 + 8 + (len(keyidxs) * 4 if stype == PayTo_Multisig else 0))
        self.buf = buf
        if packvalues:
            off = 0
            if stype not in spendstr:
                raise BadTransaction("unknown txin type")
            if threshold != len(keyidxs):
                raise BadTransaction("threshold not met")
            off += pack_int(buf, off, stype)
            off += pack_hash(buf, off, prevhash)
            off += pack_int(buf, off, previdx)
            off += pack_int(buf, off, coinid)
            off += pack_long(buf, off, amount)
            if stype == PayTo_Multisig:
                for keyidx in keyidxs:
                    off += pack_int(buf, off, keyidx)
            self.key = key
            self.threshold = threshold
            self.keys = keys

    def size(self):
        return 4 + HASHLEN + 4 + 4 + 8 + (len(self.addresses()) * 4 if self.spendtype() == PayTo_Multisig else 0)

    # size of the corresponding credential for this txinput
    def credsize(self):
        # these magic numbers come from the txcred object down below
        return 8 + PUBKEYLEN + SIGNATURELEN if self.spendtype() == PayTo_PubKeyHash else 0 # XXX handle multisig credentials

    def spendtype(self):
        return unpack_int(self.buf, 0)[1]

    def prevhash(self):
        return unpack_hash(self.buf, 4)[1]

    def previdx(self):
        return unpack_int(self.buf, 4 + HASHLEN)[1]

    def coinid(self):
        return unpack_int(self.buf, 4 + HASHLEN + 4)[1]

    def amount(self):
        return unpack_long(self.buf, 4 + HASHLEN + 8)[1]

    def __lt__(self, other):
        return self.prevhash() < other.prevhash()

    def wire_representation(self):
        return self.buf

    def _sign_ranges_with_key(self, txbuf, ranges, privatekey):
        if self.spendtype() == PayTo_PubKeyHash:
            digest = sha256_ranges(txbuf, ranges)
            pubkey = key_to_pubkey(self.key)
            signature = self.key.sign(digest)
#            print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
#            print("ABOUT TO SIGN %s" % (binascii.hexlify(digest)))
#            print("SIG %s" % (binascii.hexlify(signature)))
#            print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            return pubkey, signature
        if self.spendtype() == PayTo_Multisig:
            # XXX handle this case
            pass
        else:
            raise BadTransaction("unknown txin type")

    def gen_credential(self, txbuf, ranges):
        if self.spendtype() == PayTo_PubKeyHash:
            pubkey, signature = self._sign_ranges_with_key(txbuf, ranges, self.key)
            return TxCredential(None, packvalues=True, stype=PayTo_PubKeyHash, pubkey=pubkey, signature=signature)

        elif self.stype == PayTo_Multisig:
            sigs = []
            for key in self.keys:
                keyidx = 0   # XXX
                signature = self._sign_ranges_with_key(txbuf, ranges, key)
                sigs.append((keyidx, signature))
            # XXX issue credential with key indices in the original multisig and 

            if self.threshold <= 0 or self.threshold >= len(self.addresses) or len(self.addresses) == 1:
                raise BadTransaction("bad threshold and number of multisig addresses")
            off = 0
            off += pack_int(self.buf, off, self.threshold)
            off += pack_int(self.buf, off, len(self.addresses))
            # add the index of key in the original utxo, then the signature
            self.keys = keys
            for keyidx, addr in sorted(self.keys):
                off += pack_int(self.buf, off, keyidx)   
                off += pack_signature(self.buf, off, addr)

    def is_valid(self, txbuf, ranges, txcred, dag):
        if self.spendtype() not in set([PayTo_PubKeyHash, PayTo_Multisig,Unstake,MintReward]):
            raise BadTransaction("not a recognized type")
        # check to make sure that prevhash exists and is valid
        prevtx = dag.lookup(self.prevhash())
        if prevtx is None:
            raise BadTransaction("prev hash is not in the database")
        prevtxouts = prevtx.outputs()
        previdx = self.previdx()
        # check to make sure that previdx is a valid index
        if previdx < 0 or previdx >= len(prevtxouts):
            raise BadTransaction("prev idx is not a valid output index, %d not in [0,%d)" % (previdx, len(prevtxouts)))
        #XXX check to make coinid exists in the system
        if self.spendtype() == PayTo_PubKeyHash:
            # check to make sure that the coinid named here is the same as the coinid in the prevtx
            if prevtxouts[previdx].coinid() != self.coinid():
                raise BadTransaction("tx input does not match the coinid it is trying to spend, %d %d" % (prevtxouts[previdx].coinid(), self.coinid()))
            # check to make sure that the amount to be spent is equal to the amount in the prevtx
            if prevtxouts[previdx].amount() != self.amount():
                raise BadTransaction("tx input amount does not equal the amount in the spend output, %d %d" % (prevtxouts[previdx].amount(), self.amount()))
            # check to make sure that the current time is after the locktime of the prevtx
            rightnow = time.time()
            if prevtxouts[previdx].locktime() > rightnow:
                raise BadTransaction("tx input is locked until %s and it is now %s" % (time.ctime(prevtxouts[previdx].locktime()), time.ctime(rightnow)))

        elif self.spendtype() == Unstake:
            # check to make sure that the coinid named here is the same as the coinid in the prevtx, and that it is Ava
            if prevtxouts[previdx].coinid() != self.coinid() or self.coinid() != COINIDAVA:
                raise BadTransaction("unstake is trying to get back non-Ava coin, %d" % (self.coinid()))
            # check to make sure that the amount to be unstaked is equal to the amount in the prevtx that was staked
            if prevtxouts[previdx].amount() != self.amount():
                raise BadTransaction("unstake amount does not equal the staked amount, %d %d" % (prevtxouts[previdx].amount(), self.amount()))
            # check to make sure that the staking epoch is over
            if prevtxouts[previdx].epoch() >= current_epoch():
                raise BadTransaction("cannot unstake until the end of epoch at %d" % (prevtxouts[previdx].epoch()))

        elif self.spendtype() == MintReward:
            # check to make sure that the coinid named here is the same as the coinid in the prevtx, and that it is Ava
            if prevtxouts[previdx].coinid() != self.coinid() or self.coinid() != COINIDAVA:
                raise BadTransaction("unstake is trying to get back non-Ava coin, %d" % (self.coinid()))
            # check to make sure that the amount to be minted is the allowed interest for that epoch
            if prevtxouts[previdx].amount() != self.amount():
                raise BadTransaction("unstake amount does not equal the staked amount, %d %d" % (prevtxouts[previdx].amount(), self.amount()))
            # check to make sure that the staking epoch is over
            if prevtxouts[previdx].epoch() >= current_epoch():
                raise BadTransaction("cannot unstake until the end of epoch at %d" % (prevtxouts[previdx].epoch()))

        # time to check the signature
#            print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
#            print("ABOUT TO VRFY %s" % (binascii.hexlify(digest)))
#            print("SIG %s" % (binascii.hexlify(txcred.signature())))
#            print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        # check to make sure that the pubkey in the credential has a hash that corresponds to the address in the utxo
        keyaddr = pubkey_to_address(txcred.pubkey())
        vk = bytes_to_pubkey(txcred.pubkey())
        if prevtxouts[previdx].address() != keyaddr:
            raise BadTransaction("transaction is trying to spend %s, with a pubkey address of %s" % (address_to_ui(prevtxouts[previdx].address()), 
                                                                                                         address_to_ui(keyaddr)))
        # now check that the signature is good
        digest = sha256_ranges(txbuf, ranges)
        if not vk.verify(txcred.signature(), digest):
            raise BadTransaction("signature failed to verify")

        return True, "ok"

    def __str__(self):
        tstr = "TxInput(type=%s, prevhash=%s, previdx=%d, coinid=%d, amount=%d)" % (spendstr[self.spendtype()], hex(int.from_bytes(self.prevhash(), "big")), self.previdx(), self.coinid(), self.amount())
        return tstr

#XXX handle a multisig credential

class TxCredential:
    # a spend is an (address, signature tuple)
    def __init__(self, buf=None, packvalues=False, stype=0, pubkey=None, signature=None):
        if buf is None and packvalues:
            baselen = 4 + 4 
            if stype == PayTo_PubKeyHash:
                fulllen = baselen + PUBKEYLEN + SIGNATURELEN
            else:
                fulllen = baselen + 8 + (PUBKEYLEN + SIGNATURELEN) * len(addresses)
            buf = bytearray(fulllen)
        self.buf = buf
        if packvalues:
            off = 0
            off += pack_int(buf, off, 8 + PUBKEYLEN + SIGNATURELEN)
            off += pack_int(buf, off, stype)
            if stype == PayTo_PubKeyHash:
                off += pack_pubkey(buf, off, pubkey)
                off += pack_signature(buf, off, signature)
            else:
                # XXX handle multisig
                pass

    def size(self):
        return unpack_int(self.buf, 0)[1]

    def spendtype(self):
        return unpack_int(self.buf, 4)[1]

    def pubkey(self):
        return unpack_pubkey(self.buf, 8)[1]

    def signature(self):
        return unpack_signature(self.buf, 8 + PUBKEYLEN)[1]

    def is_valid(self, txbuf, ranges, txin, dag):
        # check to see if the credential is valid
        if len(self.buf) <= 4 or self.size() <= 8:
            raise BadTransaction("too short for length and type")
        if self.spendtype() not in spendstr:
            raise BadTransaction("not a supported type")
        if self.spendtype() == PayTo_PubKeyHash and self.size() != (8 + PUBKEYLEN + SIGNATURELEN):
            raise BadTransaction("credential length does not match expected length for payto_pubkeyhash")
        if self.spendtype() == PayTo_PubKeyHash:
            pass
        elif self.spendtype() == PayTo_Multisig:
            # XXX check the validity of a Multisig
            pass
        # check if the txin is valid
        if not txin.is_valid(txbuf, ranges, self, dag):
            raise BadTransaction("txin not valid")
        return True

    def wire_representation(self):
        return self.buf

    def __str__(self):
        return "TxCredential(type=%d, length=%d,\n\t pubkey=%s,\n\t pubkey addr=%s\n\t sig=%s)" % (self.spendtype(), self.size(), 
                                                                                                   binascii.hexlify(self.pubkey()), 
                                                                                                   address_to_ui(pubkey_to_address(self.pubkey())),
                                                                                                   binascii.hexlify(self.signature()))


# A maximum transaction size is necessary to deter DoS. 
MAXTXSIZE=100*1024 
# In-memory representation of a transaction
class Transaction:
    def __init__(self, buf=None, inputs=[], outputs=[], parents=[]):
        if buf is None:
            txsize = 4 + 4 + len(parents) * HASHLEN + 8 + sum(x.size() for x in inputs+outputs) + sum(x.credsize() for x in inputs)
            self.buf = buf = bytearray(txsize) 

            # XXX check to see if it would exceed max transaction size

            # version of this transaction
            parents = sorted(parents)
            inputs = sorted(inputs)
            outputs = sorted(outputs)
            off = 0
            off += pack_int(buf, off, TXVERSION)
            off += pack_int(buf, off, len(parents))
            for parent in parents:
                off += pack_hash(buf, off, parent)
            # pack the outputs
            off += pack_int(buf, off, len(outputs))
            for txout in outputs:
                buf[off:off+txout.size()] = txout.wire_representation()[:]
                off += txout.size()
            self.endofoutputs = off
            # skip over the inputs to find out where the credentials are
            off += pack_int(buf, off, len(inputs))
            self.startofinputs = off
            for txin in inputs:
               off += txin.size()
            self.startofcredentials = off
            # OK, we now determined where the credentials should be, now go over the inputs and generate the credentials
            off = self.startofinputs
            credoff = self.startofcredentials
            credentials = []
            for txin in inputs:
#                stroff(buf, off)
                startofthisinput = off
                startofcorrespondingcredential = credoff
                buf[off:off+txin.size()] = txin.wire_representation()
                off += txin.size()
                endofthisinput = off
                credoff += txin.credsize()
                cred = txin.gen_credential(buf, [(0, self.endofoutputs), (startofthisinput, endofthisinput)])
                credentials.append(cred)
            # we do not store the number of credentials, because it is always the same as the inputs
            for txcred in credentials:
#                stroff(buf, off)
                buf[off:off+txcred.size()] = txcred.wire_representation()
                assert len(txcred.wire_representation()) == txcred.size(), "txcred size mismatch"
                off += txcred.size()
#                stroff(buf, off)
        else: 
            self.buf = buf
        self._compute_hash()
        self.children = []
        self.conflicts = []

    def is_valid(self, dag):
        if self.version() != TXVERSION:
            raise BadTransaction("incompatible version")
        #        if len(self.parents()) == 0:
        #    return False, "no parents"
        # XXX check to make sure that the parents are in canonical order
        # XXX check to make sure that the inputs are in canonical order
        # XXX check to make sure that the outputs are in canonical order
        #    XXX locktime requires special handling, as a tx that's invalid now can become valid with the passage of time
        self.endofoutputs, outputs = self._outputs_offset()
        total_sent = defaultdict(int)  # mapping from coinid to sum total coins sent
        for txout in outputs:
            if not txout.is_valid():
                return False
            total_sent[txout.coinid()] += txout.amount()
        startofthisinput = self._start_of_inputs_offset()
        spends = {}
        # iterate over all txins and their corresponding credentials
        for txin, txcred in zip(self.inputs(), self.credentials()):
            endofthisinput = startofthisinput + txin.size()
            # check to make sure that each input is unique
            txkey = "%s|%d" % (binascii.hexlify(txin.prevhash()), txin.previdx())
            if txkey in spends:
                raise BadTransaction("same input appears more than once in transaction")
            spends[txkey] = (txin.coinid(), txin.amount())
            
            # check to make sure that the credential and input are valid
            if not txcred.is_valid(self.buf, [(0, self.endofoutputs), (startofthisinput, endofthisinput)], txin, dag):
                return False
            startofthisinput = endofthisinput
        total_consumed = defaultdict(int)  # mapping from coinid to sum total coins on the input
        # sum up all the inputs, grouped by coinid
        for coinid, amount in spends.values():
            total_consumed[coinid] += amount
        # check to make sure that the sum of coins of different kinds on the inputs is greater than the sum of the outputs on the outputs
        # XXX check to make sure there can be no over or underflow here
        for coinid in total_sent:
            if coinid not in total_consumed:
                raise BadTransaction("transaction sends coinid %d without consuming it" % coinid)
            if total_consumed[coinid] < total_sent[coinid]:
                raise BadTransaction("transaction tried to generate coins out of thin air, consumed %d coints of type %d, sent %d" % (total_consumed[coinid], coinid, total_sent[coinid]))
        return True

    def version(self):
        return unpack_int(self.buf, 0)[1]

    # returns the position just past the parents, as well as the list of parent hashes
    def _parents_offset(self):
        buf = self.buf
        off = 4
        nlen, nparents = unpack_int(buf, off)
        off += nlen
        parents = []
        for i in range(nparents):
            nlen, parenthash = unpack_hash(buf, off)
            off += nlen
            self.parents.append(parenthash)
        return off, parents

    # returns the offset of the end of outputs, and the outputs
    def _outputs_offset(self):
        buf = self.buf
        off, _ = self._parents_offset()
        nlen, ntxout = unpack_int(buf, off)
        off += nlen
        outputs = []
        for i in range(ntxout):
            txout = TxOutput(memoryview(buf[off:]))
            off += txout.size()
            outputs.append(txout)
        return off, outputs

    def _start_of_inputs_offset(self):
        offset, _ = self._outputs_offset()
        return offset+4    # 4 is for the int that stores the number of inputs
        
    def _inputs_offset(self):
        buf = self.buf
        off, _ = self._outputs_offset()
        nlen, ntxin = unpack_int(buf, off)
        off += nlen
        inputs = []
        for i in range(ntxin):
            txin = TxInput(memoryview(buf[off:]))
            off += txin.size()
            inputs.append(txin)
        return off, inputs

    def parents(self):
        _, parents = self._parents_offset()
        return parents

    def outputs(self):
        _, outputs = self._outputs_offset()
        return outputs

    def inputs(self):
        _, inputs = self._inputs_offset()
        return inputs

    def credentials(self):
        buf = self.buf
        off, inputs = self._inputs_offset()
        credentials = []
        for cred in range(len(inputs)):
            nlen, credlen = unpack_int(buf, off)
            txcred = TxCredential(memoryview(buf[off:off+credlen]))
            off += credlen
            credentials.append(txcred)
        return credentials

    def txhash(self):
        return self._txhash

    def _compute_hash(self):
        self._txhash = hashlib.sha256(self.buf).digest()

    def add_children(self, children):
        self.children.append(children)

    def add_conflicts(self, conflictingtx):
        self.conflicts.append(children)

    def size(self):
        return len(self.buf)

    # this is how this transaction would be seen on the wire in the network
    def wire_representation(self):
        return self.buf

    def __str__(self):
        tstr = "Transaction(hash=%s, ninputs=%d, noutputs=%d)" % (binascii.hexlify(self._txhash), len(self.inputs()), len(self.outputs()))
        for idx, txin in enumerate(self.inputs()):
            tstr += "\n\tIn[%d] : %s" % (idx, str(txin))
        for idx, txout in enumerate(self.outputs()):
            tstr += "\n\tOut[%d]: %s" % (idx, str(txout))
        for idx, txcred in enumerate(self.credentials()):
            tstr += "\n\tCredential[%d]: %s" % (idx, str(txcred))
        return tstr


