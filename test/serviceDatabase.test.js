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
            await this.service.init();

            done();
        });
    });    

 
    it('Create a bunch of blocks', async () => {

        const count = 10;

        await Array(count).fill(0).reduce( (acc, item)=> {
            return acc.then( () => this.service.createNewBlock()) 
        }, Promise.resolve())

        const serviceAddress = await this.service.getServiceAddress(); 
        const state = await this.service.getState(serviceAddress); 

        assert(state.balance === count * ServiceConfig.blockReward)

        const statesCount = await this.service.getStatesCount();
        assert (statesCount === 1)
    });

    it('Test sending', async () => {
        const serviceAddress = await this.service.getServiceAddress(); 

        const address1 = serviceAddress;

        // create second address
        const address2 = await this.service.generateNewAddress();
        
        await this.service.createNewBlock();

        let state1 = await this.service.getState(address1); 
        assert(state1.balance === ServiceConfig.blockReward)

        await this.service.send(address1, address2, ServiceConfig.blockReward / 2)
        
        // check it is not in state until new block
        state1 = await this.service.getState(address1); 
        assert(state1.balance === ServiceConfig.blockReward)

        await this.service.createNewBlock();

        state1 = await this.service.getState(address1); 
        assert(state1.balance === ServiceConfig.blockReward * 3 / 2)
        
        let state2 = await this.service.getState(address2); 
        assert(state2.balance === ServiceConfig.blockReward / 2)

        // create second address
        const address3 = await this.service.generateNewAddress();

        await this.service.send(address1, address3, ServiceConfig.blockReward / 2)
        await this.service.createNewBlock();

        state1 = await this.service.getState(address1); 
        assert(state1.balance === ServiceConfig.blockReward * 2)
        
        state2 = await this.service.getState(address2); 
        assert(state2.balance === ServiceConfig.blockReward / 2)

        let state3 = await this.service.getState(address3); 
        assert(state3.balance === ServiceConfig.blockReward / 2)

    });
});