const ServiceMemory = require("../src/core/blockchain/serviceMemory")
const Config = require("../src/core/blockchain/config")
const assert = require('assert');


describe('Memory blockchain test', async () => {

    beforeEach(async () => {
        this.service = new ServiceMemory();
        await this.service.init();

    });

    after(() => {
        
    });

    it('Create a bunch of block', async () => {
        
        const count = 10;

        await Array(count).fill(0).reduce( (acc, item)=> {
            return acc.then( () => this.service.createNewBlock()) 
        }, Promise.resolve())
        
        const serviceAddress = await this.service.getServiceAddress(); 

        const state = await this.service.getState(serviceAddress); 

        assert(state.balance === count * Config.blockReward)

        assert(state.txs.length === count)
        assert(this.service.ledger.length === count)
        assert(this.service.pendingTxs.length === 0)

        const statesCount = await this.service.getStatesCount();
        assert (statesCount === 1)
    });

    it('test coinbase transactions', async () => {
        await this.service.createNewBlock();
        assert(this.service.ledger.length === 1)
        assert(this.service.ledger[0].txs.length === 1);
    });

    it('send', async () => {
        
        const userAddress = await this.service.generateNewAddress();
        await this.service.createNewBlock();

        
        const serviceAddress = await this.service.getServiceAddress(); 
        await this.service.send(serviceAddress,userAddress, 1);

        const stateService  = await this.service.getState(serviceAddress);
        const stateUser     = await this.service.getState(userAddress);

        // before block
        assert(stateService.balance === Config.blockReward)
        assert(stateUser.balance === 0);

        await this.service.createNewBlock();

        // after block
        assert(stateService.balance === (Config.blockReward*2 - 1))
        assert(stateUser.balance === 1);
    });

});