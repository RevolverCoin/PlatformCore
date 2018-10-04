const mongoose = require('mongoose');

const ServiceDatabase = require("../src/core/blockchain/serviceDatabase")
const ServiceConfig = require("../src/core/blockchain/config")
const Config = require('../src/config')

const assert = require('assert');


describe('Blockchain Database Test', () => {
    
    before( done => {
        if (mongoose.connection.db) return done();
        mongoose.connect(Config.MONGO_TEST_URL, { useNewUrlParser: true }, done)
    })

    after(done => {
        mongoose.connection.close(done);
    })

    beforeEach((done) => {
        mongoose.connection.db.dropDatabase( async () => {

            this.service = new ServiceDatabase();
            await this.service.generateNewAddress();

            done();
        });
    });    


    it('Create a bunch of blocks', async () => {

        const count = 10;

        await Array(count).fill(0).reduce( (acc, item)=> {
            return acc.then( () => this.service.createNewBlock()) 
        }, Promise.resolve())

        const state = await this.service.getState(this.service.coinbaseAddress); 

        assert(state.balance === count * ServiceConfig.blockReward)

        const statesCount = await this.service.getStatesCount();
        assert (statesCount === 1)
    });

    // it('Create a bunch of block 2', async () => {
    //     await this.service.createNewBlock();
    // });
});