const Block = require("./block");
const {cryptoHash} = require("../util");
const Transaction = require('../wallet/transaction');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({data}) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length-1],
            data
        });

        this.chain.push(newBlock);
    }

    static isValidChain(chain) {
        if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            return false;
        }
        
        for(let i=1;i<chain.length;i++) {
            const {timestamp, lastHash, hash, data, nonce, difficulty } = chain[i];

            const actualLastHash = chain[i-1].hash;
            const lastDifficulty = chain[i-1].difficulty;

            if(lastHash !== actualLastHash) {
                return false;
            }

            const validateHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

            if(Math.abs(lastDifficulty - difficulty) > 1) {
                return false;                
            } 

            if(hash !== validateHash) {
                return false;
            }
        }
        
        return true;
    }
    
    replaceChain(chain, onSuccess) {
        if(chain.length <= this.chain.length) {
            console.error('The incoming chain must be longer');
            return;
        }

        if(!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain must be valid');
            return;
        }

        if(onSuccess) onSuccess();
        console.log(chain);
        this.chain = chain;
    }

    validTransactionData({chain}) {
        for(let i=1;i<chain.length;i++) {
            const block = chain[i];
            let rewardTransactionCount = 0;

            for(let transaction of block.data) {
                if(transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount += 1;

                    if(rewardTransactionCount > 1) {
                        console.error('Miner reward exceeds the limit');
                        return false;
                    }

                    if(Object.values(transaction.outputMap)[0] != MINING_REWARD) {
                        console.error('Miner reward amount is invalid');
                        return false;
                    }
                }
                else {
                    if(!Transaction.validTransaction(transaction)) {
                        console.error('Invalid transaction');
                        return false;
                    }
                }


            }
        }

        return true;
    }


}

module.exports = Blockchain;

