const Blockchain = require('.');
const Block = require("./block");
const {cryptoHash} = require("../util");
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');

describe('blockchain', () => {
    // const blockchain = new Blockchain();
    let blockchain, newChain, originalChain, errorMock;
    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        errorMock = jest.fn();

        originalChain = blockchain.chain;
        global.console.error = errorMock;
    });

    it('instance of blockchain is created', () => {
        expect(blockchain instanceof Blockchain).toBe(true);
    });

    it('contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    }); 

    it('new block is added to chain', () => {
        const newData = 'foo bar';
        blockchain.addBlock({data: newData});
        expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(newData);
    });

    describe('isValidChain()', () => {
        describe('when the chain does not start with the genesis block', () => {
            it('return false', () => {
                blockchain.chain[0] = { data: 'fake-genesis' };
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });

        describe('when the chain starts with the genesis block and has multiple blocks', () => {
            beforeEach(() => {
                blockchain.addBlock({data: 'Beers'});
                blockchain.addBlock({data: 'beets'});
                blockchain.addBlock({ data: 'Battlestar Galactica' });
            });

            describe('and a lastHash reference has changed', () => {
                it('return false', () => {
                    blockchain.chain[2].lastHash = 'broken-lastHash';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with an invalid field', () => {
                it('return false', () => {
                    blockchain.chain[2].data = 'some-bad-and-evil-data';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with a jumped difficulty', () => {
                it('returns false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length-1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty-3;

                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);

                    const BadBlock = new Block({timestamp, lastHash, hash, nonce, difficulty, data});
                    blockchain.chain.push(BadBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });
            describe('and the chain does not contains any invalid blocks', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });

        });
    });

    describe('replaceChain()', () => {
        let logMock;

        beforeEach(() => {
            logMock = jest.fn();

            global.console.log = logMock;

        });

        describe('newchain is shorter than the current one', () => {
            beforeEach(() => {
                newChain.chain[0] = {new: 'chain'};
                blockchain.replaceChain(newChain.chain);
            });

            it('donot replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain);
            });

            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });
        
        describe('newChain is greater than the current one', () => {
            beforeEach(() => {
                newChain.addBlock({data: 'Beers'});
                newChain.addBlock({data: 'beets'});
                newChain.addBlock({ data: 'Battlestar Galactica' });
            });

            describe('newChain is not valid',() => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'some-fake-hash';
                    blockchain.replaceChain(newChain.chain);
                });

                it('donot replace the chain', ()=> {
                    expect(blockchain.chain).toEqual(originalChain);
                });

                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('newChain is valid',() => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain);
                });
                it('replace the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('logs about the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });
    });

    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet;
    
        beforeEach(() => {
          wallet = new Wallet();
          transaction = wallet.createTransaction({ recipient: 'foo-address', amount: 65 });
          rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet.publicKey });
        });
    
        describe('and the transaction data is valid', () => {
          it('returns true', () => {
            newChain.addBlock({ data: [transaction, rewardTransaction] });
    
            expect(blockchain.validTransactionData({ chain: newChain.chain }).toBe(true));

        });
    });

    describe('and the transaction data has multiple rewards', () => {
      it('returns false', () => {
        newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });

        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
      });
    });

    describe('and the transaction data has at least one malformed outputMap', () => {
      describe('and the transaction is not a reward transaction', () => {
        it('returns false', () => {
          transaction.outputMap[wallet.publicKey] = 999999;

          newChain.addBlock({ data: [transaction, rewardTransaction ]});

          expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
        });
      });

      derscribe('and the transaction is a reward transaciton', () => {
        it('returns false', () => {});
      });
    });

    describe('and the transaction data has at least one malformed input', () => {
      it('returns false and logs an error', () => {});
    });

    describe('and a block contains multiple identical transactions', () => {
      it('returns false and logs an error', () => {});
    });
  });

    
});