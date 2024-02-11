const PubNub = require('pubnub');
const redis = require('redis');
const cryptoHash = require("../util/crypto-hash");
const Blockchain = require("../blockchain");

const credentials = {
    publishKey: 'pub-c-8e4ac2f1-a9e5-44da-a09c-977d3f43a7a3',
    subscribeKey: 'sub-c-c27600a8-5433-4062-b131-cdc07a5f6594',
    secretKey: 'sec-c-YWYzNTQwYWQtM2U0Ni00Y2ViLWIwN2EtODBhODI2M2I5MzY1',
    uuid : cryptoHash('uuid1234')
};

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
}

class PubSub {
    constructor({ blockchain, transactionPool, wallet}) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;

        this.pubnub = new PubNub(credentials);

        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

        this.pubnub.addListener(this.listener());
    }

    listener() {
        return {
            message: messageObject => {
                const { channel, message } = messageObject;

                console.log(`Message received. Channel: ${channel}. Message: ${message}`); 
                const parsedMessage = JSON.parse(message);
                
                switch(channel) {
                    case CHANNELS.BLOCKCHAIN:
                        this.blockchain.replaceChain(parsedMessage, true, () => {
                            this.transactionPool.clearBlockchainTransactions({
                                chain: parsedMessage
                            });
                        });
                        break;
                    case CHANNELS.TRANSACTION:
                        if (!this.transactionPool.existingTransaction({
                            inputAddress: this.wallet.publicKey
                          })) {
                            this.transactionPool.setTransaction(parsedMessage);
                        }
                        break;
                    default:
                        return;
                }
                
            }

        };
    }

    publish({ channel, message}) {
        this.pubnub.publish({ channel, message });
    }
    
    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    }

}


module.exports = PubSub;

