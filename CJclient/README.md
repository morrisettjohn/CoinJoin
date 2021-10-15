# CJclient

Application that runs a coinjoin client.  Contains multiple commands that help perform coinjoins

OPERATION:
    In order to obtain basic info about the client, 'run node coinjoin.js' info to get a list of possible commands (without the quotation marks).

THE COINJOIN PROTOCOL:

    The CoinJoin protocol is a system designed to increase anonymity amonsgt users of the coinjoin.  At a basic level, a coinjoin is a trustless system for combining several smaller transactions into one larger transaction.  For the sake of example, take 5 users who want to send 1 Avax to 5 other distinct friends of theirs.

    Alice --> 1 Avax --> Bob
    Candice --> 1 Avax --> Dylan
    Eddie --> 1 Avax --> Francine
    Gerard --> 1 Avax --> Haley
    Ian --> 1 Avax --> Jolene

    If each person directly sent 1 avax, the entire blockchain could check that Alice sent Avax to Bob, Candice sent Avax to Dylan, so on and so forth.
    However, because blockchains can have multiple inputs and outputs, if Alice, Candice, Eddie, Gerard, and Ian were to combine their inputs into one larger transaction, they could send Avax to Bob, Dylan, Francine, Haley, and Jolene without being linked to it.

    Alice   --> 1 Avax |              | --> 1 Avax --> Jolene
    Candice --> 1 Avax |   Large Tx   | --> 1 Avax --> Dylan
    Eddie   --> 1 Avax | 5 Avax total | --> 1 Avax --> Francine
    Gerard  --> 1 Avax |              | --> 1 Avax --> Haley
    Ian     --> 1 Avax |              | --> 1 Avax --> Bob

    In the larger transaction, every member has 5 possible people they could be sending Avax to.  It is much more difficult to detect who it is.  This is also why every input and output has a uniform amount:  Otherwise it would be very easy to detect who is sending currency to someone else.

    Alice   --> 2 Avax |              | --> 1 Avax --> Jolene
    Candice --> 1 Avax |   Large Tx   | --> 1 Avax --> Dylan
    Eddie   --> 1 Avax | 6 Avax total | --> 1 Avax --> Francine
    Gerard  --> 1 Avax |              | --> 1 Avax --> Haley
    Ian     --> 1 Avax |              | --> 2 Avax --> Bob

    In the example above, it is clear that Alice is sending Bob currency, because they are the only ones sending and recieivng 2 Avax instead of 1.  Additionally, this hurts Candice, Eddie, Gerard, and Ian as well.  The more users enter the coinjoin, the less chance there is of an input and output being linked together.  In a join with only 2 people, finding who wants to send currency to the other person is a coin flip.  But, in a 10 person server, detecting the correct matching of inputs/outputs is a 10% chance.  In the example above, Alice has reduced everyone else's anonymity from a 20% chance of detection to a 25% chance of detection.  This is why uniform inputs are required.

    COINJOIN AND TRUSTLESS PROTOCOLS:

    What makes the coinjoin protocol trustless?  The coinjoin protocol works by using different states.  In the first state, users construct the inputs and outputs they wish to enter into the coinjoin, and then enter them.  

    SERVER:     INPUTS:              OUTPUTS:
    Alice:      Contributes 1 Avax | Wants to send 1 Avax to Bob
    Candice:    Contributes 1 Avax | Wants to send 1 Avax to Dylan
    Eddie:      Contributes 1 Avax | Wants to send 1 Avax to Francine
    Gerard:     Contributes 1 Avax | Wants to send 1 Avax to Haley
    Ian:        Contributes 1 Avax | Wants to send 1 Avax to Jolene

    Once a sufficient number of inputs have been collected, the server that operates the coinjoin constructs an unsigned transaction, which is essentially a collection of inputs and outputs.  However, this transaction does not contain the signatures of the participants, and cannot be issued.  It is essentially worthless unless EVERYONE signs the transaction.  Once this transaction has been constructed, the server sends the unsigned transaction to each of the participants.

    UNSIGNED TX:
    Input: (Alice   --> 1 Avax + [no signature]) |              | --> Output: (1 Avax --> Jolene)
    Input: (Candice --> 1 Avax + [no signature]) |   Large Tx   | --> Output: (1 Avax --> Dylan)
    Input: (Eddie   --> 1 Avax + [no signature]) | 5 Avax total | --> Output: (1 Avax --> Francine)
    Input: (Gerard  --> 1 Avax + [no signature]) |              | --> Output: (1 Avax --> Haley)
    Input: (Ian     --> 1 Avax + [no signature]) |              | --> Output: (1 Avax --> Bob)
    
    SERVER:
    sends Unsigned Tx --> Alice
    sends Unsigned Tx --> Candice
    sends Unsigned Tx --> Eddie
    sends Unsigned Tx --> Gerard
    sends Unsigned Tx --> Ian

    Each person that has put in an input then checks that no tampering has been performed on the transaction.  For instance, if the server is owned by Greg, who is a malicious individual, he might want to take some of Alice's utxos and send them to himself.

    In the above Unsigned Tx, Greg may choose to add some of Alice's other coins into the mix

    UNSIGNED TX:
    Input: (Alice   -->  1 Avax [no signature]) |               | --> Output: ( 1 Avax --> Jolene)
    Input: (Alice   --> 42 Avax [no signature]) |               | --> Output: ( 1 Avax --> Dylan)
    Input: (Candice -->  1 Avax [no signature]) |   Large Tx    | --> Output: (42 Avax --> Greg)
    Input: (Eddie   -->  1 Avax [no signature]) | 47 Avax total | --> Output: ( 1 Avax --> Francine)
    Input: (Gerard  -->  1 Avax [no signature]) |               | --> Output: ( 1 Avax --> Haley)
    Input: (Ian     -->  1 Avax [no signature]) |               | --> Output: ( 1 Avax --> Bob)

    Alice takes a look at the transaction and notices the discrepency.  Alice chooses not to sign the transaction, and therefore her assets are protected.  Additionally, Alice knows not to trust Greg, because clearly he is acting with bad intent.

    Instead, if Alice chooses to use a coinjoin server run by Amy, who does not act maliciously, she will look at Amy's non-malicious transaction and notice that there are no discrepencies.

    UNSIGNED TX:
    Input: (Alice   --> 1 Avax + [no signature]) |              | --> Output: (1 Avax --> Jolene)
    Input: (Candice --> 1 Avax + [no signature]) |   Large Tx   | --> Output: (1 Avax --> Dylan)
    Input: (Eddie   --> 1 Avax + [no signature]) | 5 Avax total | --> Output: (1 Avax --> Francine)
    Input: (Gerard  --> 1 Avax + [no signature]) |              | --> Output: (1 Avax --> Haley)
    Input: (Ian     --> 1 Avax + [no signature]) |              | --> Output: (1 Avax --> Bob)

    Alice, and the other users inputting Avax, decide that this is a good transaction.  They all sign the unsigned tx, and send that to the server.

    Alice   --> Alice's signature   --> Server
    Candice --> Candice's signature --> Server
    Eddie   --> Eddie's signature   --> Server
    Gerard  --> Gerard's signature  --> Server
    Ian     --> Ian's signature     --> Server

    Now, Amy's server will construct the signed transaction, and then issue it.

    SIGNED TX:
    Input: (Alice   --> 1 Avax + [A's signature]) |              | --> Output: (1 Avax --> Jolene)
    Input: (Candice --> 1 Avax + [C's signature]) |   Large Tx   | --> Output: (1 Avax --> Dylan)
    Input: (Eddie   --> 1 Avax + [E's signature]) | 5 Avax total | --> Output: (1 Avax --> Francine)
    Input: (Gerard  --> 1 Avax + [G's signature]) |              | --> Output: (1 Avax --> Haley)
    Input: (Ian     --> 1 Avax + [I's signature]) |              | --> Output: (1 Avax --> Bob)

    Amy will take this signed transaction and then issue the transaction, and everyone will have their inputs and outputs honored.


HOW THE SERVER WORKS:
    JOIN STATES:
        The server uses the basics of the coinjoin protocol to form transactions, but runs multiple "joins" at the same time.  For instance, the server can run a join that has a user threshold of 3 and specifies that users input 10 Avax, but also can have a join that has a user threshold of 5 and specifies that users input 100 avax.  As many of these joins as the owner wants can be formed.  These are called "join states" and run independently of other join states

    SERVER OWNERS AND FEES:
        In order to reward server owners for their operation of a coinjoin server, they may include fees to offset the costs of running the server.  For instance, instead of having users input 1 Avax, the server may charge a 1% fee on everyone's inputs.  The user's outputs will still be exactly 1 Avax, but the input amount will be 1.01 Avax.  An example would look like this:

        SIGNED TX:
        Input: (Alice   --> 1.01 Avax + [A's signature]) |              | --> Output: (1 Avax --> Jolene)
        Input: (Candice --> 1.01 Avax + [C's signature]) |   Large Tx   | --> Output: (1 Avax --> Dylan)
        Input: (Eddie   --> 1.01 Avax + [E's signature]) | 5 Avax total | --> Output: (1 Avax --> Francine)
        Input: (Gerard  --> 1.01 Avax + [G's signature]) |              | --> Output: (1 Avax --> Haley)
        Input: (Ian     --> 1.01 Avax + [I's signature]) |              | --> Output: (1 Avax --> Bob)
                                                                        | --> Output: (0.05 Avax --> Server owner)

        To set the base fee percent, go into config and change STANDARD_FEE_PERCENT to any decimal between 0 - 1.  (although higher fees are obviously going to be less attractive to users)

    SAFETY AND ERROR CHECKS:
        The server runs checks to make sure that users have input correct data.  For instance, if a user tries to input a buffer that is supposed to represent a transferable input, but the buffer does not form when the server tries, the user will be denied entry into the coinjoin.  Many of these checks are run to make sure that no bad or malicious data is being sent to the server.

    USER VERIFICATION
        In order to verify who they say they are, both servers and clients send each other half of a randomly generated nonce.  Both sides then complete the other half of the nonce, sign said nonce, and then send back both the full nonce and the signature of the full nonce to the other side.  Both sides then verify that the signature came from the public address that the server/client claims they own.  In order to perform most functions, both clients and servers must perform this double verification procedure.

