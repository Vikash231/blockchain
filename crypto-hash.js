const crypto = require('crypto');

const cryptoHash = (...inputs) => {
  const hash = crypto.createHash('sha256');

  hash.update(inputs.sort().join(' '));

  return hash.digest('hex');
};

// let x = cryptoHash(1,2,3,4);
// console.log(x);
module.exports = cryptoHash;