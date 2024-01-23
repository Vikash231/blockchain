const express = require('express');
const Blockchain = require('./blockchain');
const bodyParser = require('body-parser');
const PubSub = require('./pubsub');
const request = require('request');
// require('dotenv').config();

const app = express();
const blockchain = new Blockchain();
const pubsub = new PubSub({blockchain});

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
app.use(bodyParser.json());


setTimeout(()=> pubsub.broadcastChain(), 1000);

app.get('/api/blocks', (req,res) => {
    res.json(blockchain.chain);
});

app.post('/api/mine',(req, res) => {
    const { data } = req.body;
    blockchain.addBlock({data});
    pubsub.broadcastChain();
    res.redirect('/api/blocks');
});

const syncChains = () => {
    request({url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) => {
        if(!error   &&  response.statusCode == 200) {
            const rootChain = JSON.parse(body);

            console.log('replace chain on a sync with',rootChain);
            blockchain.replaceChain(rootChain);
        }
    });
};

//const syncChains using axios
// const syncChains = async () => {
//     const response = await axios.get(`${ROOT_NODE_ADDRESS}/api/blocks`);
//     try {
//         if(response.status  == 200) {
//             const rootChain = response.data;
    
//             console.log('replace chain on a sync with', rootChain);
//             blockchain.replaceChain(rootChain);
//         }
//     } catch(error) {
//         console.error(error.message);
//     }
    
// }



let PEER_PORT;

// console.log(process.env.GENERATE_PEER_PORT);
if(process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random()*1000);
    // console.log("hello");
}

const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`listening at port: ${PORT}`);

    // if(PORT != DEFAULT_PORT)
        syncChains();
});