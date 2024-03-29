const { v4: uuidv4 } = require('uuid');
const { verifySignature } = require('../util');
const { MINING_REWARD, REWARD_INPUT } = require('../config');

class Transaction {
    constructor({senderWallet, recipient, amount, outputMap, input}) {
        this.id = uuidv4();
        this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
        this.input = input || this.createInput({senderWallet, outputMap: this.outputMap});
    }

    createOutputMap({ senderWallet, recipient, amount }) {
        const outputMap = {};
        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
        return outputMap;
    }

    createInput({senderWallet, outputMap}) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        }
    }

    update({senderWallet, recipient, amount}) {
        
        if(amount > this.outputMap[senderWallet.publicKey]) {
            throw new Error('Amount exceeds the balance');
        }

        if(!this.outputMap[recipient]) {
            this.outputMap[recipient] = amount;
        }
        else {
            this.outputMap[recipient] = this.outputMap[recipient] + amount;
        }
        this.outputMap[senderWallet.publicKey] = this.outputMap[senderWallet.publicKey] - amount;
        this.input = this.createInput({senderWallet, outputMap: this.outputMap});

    }

    static validTransaction(transaction) {
        const { input: {amount, address, signature} , outputMap} = transaction;

        const outputTotal = Object.values(outputMap).reduce((callback,count) => {
            return callback+count;
        });

        if(amount != outputTotal) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }
        if(!verifySignature({ publicKey: address, data: outputMap, signature})) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }


        return true;
    }

    static rewardTransaction({ minerWallet }) {
        return new this({
          input: REWARD_INPUT,
          outputMap: { [minerWallet.publicKey]: MINING_REWARD }
        });
    }
    
}

module.exports = Transaction;