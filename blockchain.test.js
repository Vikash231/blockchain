const Blockchain = require('./blockchain');
const Block = require("./block");
const cryptoHash = require("./crypto-hash");

describe('blockchain', () => {
    // const blockchain = new Blockchain();
    let blockchain, newChain, originalChain;
    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();

        originalChain = blockchain.chain;
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
        let errorMock, logMock;

        beforeEach(() => {
            errorMock = jest.fn();
            logMock = jest.fn();

            global.console.error = errorMock;
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

    
});