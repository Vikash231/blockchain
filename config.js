const INITIAL_DIFFICULTY = 3;
const MINE_RATE = 1000;

const GENESIS_DATA = {
    timestamp: Date.now(),
    lastHash: '-----',
    hash: 'hash-one',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
};

module.exports = { GENESIS_DATA, MINE_RATE };