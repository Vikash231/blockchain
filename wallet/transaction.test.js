const Transaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../util');

describe('transaction', () => {
    let transaction, senderWallet, recipient, amount;
    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key';
        amount = 50

        transaction = new Transaction({ senderWallet, recipient, amount });
    });

    it('has an `id`',() => {
        expect(transaction).toHaveProperty('id');
    });

    describe('OutputMap', () => {
        it('has an `outputMap`', () => {
            expect(transaction).toHaveProperty('outputMap')
        });

        it('outputs an amount  to the recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });

        it('outputs the remaining balance for the `senderWallet`', ()=> {
            expect(transaction.outputMap[senderWallet.publicKey])
                .toEqual(senderWallet.balance - amount);
        })
    });

    describe('input' , () => {
        it('has an `input`', () => {
            expect(transaction).toHaveProperty('input');
        });

        it('has a `timestamp` in the input', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        });

        it('sets the `amount` to the `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('sets the `address` to the `senderWallet` pulicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('signs the input', () => {
            expect(verifySignature({
                publicKey: senderWallet.publicKey,
                data: transaction.outputMap,
                signature: transaction.input.signature
            })).toBe(true);
        });
    });

    describe('validTransation()', () => {
        let errorMock;

        beforeEach(() => {
            errorMock = jest.fn();

            global.console.error = errorMock;
        });
        describe('when the transaction is valid', ()=> {
            it('return true',() => {
                expect(Transaction.isvalidTransaction(transaction)).toBe(true);
            });
        });

        describe('when the transaction is invalid', () => {
            describe('and a transaction outputmap value is invalid', () => {
                it('return false and logs an error',() => {
                    transaction.outputMap[senderWallet.publicKey] = 99999;
                    expect(Transaction.isvalidTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('and the transaction input signature is invalid', () => {
                it('return false and logs an error', () => {
                    transaction.input.signature = new Wallet().sign('data');
                    expect(Transaction.isvalidTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });

        
    });

    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;
        
        describe('and the amount is invalid', () => {
            it('throws an error', () => {
                expect(() => {
                  transaction.update({
                    senderWallet, recipient: 'foo', amount: 999999
                  })
                }).toThrow('Amount exceeds the balance');
              });
        });

        describe('and the amount is valid', () => {
            beforeEach(() => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = 'next-recipient';
                nextAmount = 50;
          
                transaction.update({
                  senderWallet, recipient: nextRecipient, amount: nextAmount
                });
              });
          
              it('outputs the amount to the next recipient', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
              });
          
              it('subtracts the amount from the original sender output amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey])
                  .toEqual(originalSenderOutput - nextAmount);
              });
          
              it('maintains a total output that matches the input amount', () => {
                expect(
                  Object.values(transaction.outputMap)
                    .reduce((total, outputAmount) => total+outputAmount)
                ).toEqual(transaction.input.amount);
              });
          
              it('re-signs the transaction', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
              });

              describe('and another update but for the same recipient', () => {
                let addedAmount;

                beforeEach(() => {
                    addedAmount = 80;
                    transaction.update({senderWallet, recipient: nextRecipient,amount: addedAmount});
                });

                it('adds to the recipient amount', () => {
                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount+addedAmount);
                });

                it('subtracts the amount from the original sender output amount', () => {
                    expect(transaction.outputMap[senderWallet.publicKey])
                      .toEqual(originalSenderOutput - nextAmount - addedAmount);
                });

              });
            });
        });



        
})