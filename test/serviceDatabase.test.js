const mongoose = require('mongoose');

const ServiceDatabase = require("../src/core/blockchain/serviceDatabase")
const ServiceConfig = require("../src/core/blockchain/config")
const Config = require('../src/config')

const assert = require('assert');



describe('Blockchain Database Test', () => {
    
    before( (done) => {
        mongoose.connect(Config.MONGO_TEST_URL, { useNewUrlParser: true });
        mongoose.connection.on('error', console.error.bind(console, 'connection error'));
        mongoose.connection.on('open', () => {

            // do not drop right after connection created
            setTimeout(()=>{
                mongoose.connection.db.dropDatabase( () => {
                    this.service = new ServiceDatabase();
                    this.service.generateNewAddress().then(()=>{ done() });
                });
            }, 100);

        });

    });

    after( (done) => {
        mongoose.connection.db.dropDatabase( () => {
            mongoose.connection.close(done);
        });
    });

    it('Create a bunch of block', async () => {

        const count = 10;

        await Array(count).fill(0).reduce( (acc, item)=> {
            return acc.then( () => this.service.createNewBlock()) 
        }, Promise.resolve())

        const state = await this.service.getState(this.service.coinbaseAddress); 

        assert(state.balance === count * ServiceConfig.blockReward)

        const statesCount = await this.service.getStatesCount();
        assert (statesCount === 1)
    });

});