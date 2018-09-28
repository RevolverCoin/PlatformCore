const mongoose = require('mongoose');

const ServiceDatabase = require("../core/blockchain/serviceDatabase")
const {Transaction, Block, TxType} = require("../core/blockchain/serviceBase")
const ServiceConfig = require("../core/blockchain/config")
const Config = require('../config')

var options = {
    useNewUrlParser: true
  };

mongoose.connect(Config.MONGO_TEST_URL, options);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open',  () => {
    
    mongoose.connection.db.dropDatabase(async  () => {

        this.service = new ServiceDatabase();

        await this.service.createState("200");
    
        const tx1 = new Transaction("100","200", 10, TxType.txNormal)
        const tx2 = new Transaction("100","200", 30, TxType.txNormal)

        await this.service.addPendingTx(tx1);
        await this.service.addPendingTx(tx2);

        const block = new Block(tx1, 1);
        block.txs.push(tx2);

        await this.service.registerNewBlock(block);

        // await this.service.updateState("200", 10, tx)
        
        // console.log(await this.service.getState("200"));

        // console.log(await this.service.getStatesCount());



        mongoose.connection.close();
    
    });


})