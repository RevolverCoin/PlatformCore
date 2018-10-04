const ServiceMemory = require("../src/core/blockchain/serviceMemory")
const Config = require("../src/core/blockchain/config")
const assert = require('assert');


describe('Memory blockchain test', async () => {

    beforeEach(async () => {
        this.service = new ServiceMemory();
        await this.service.generateNewAddress();

    });

    after(() => {
        
    });

    it('Create a bunch of block', async () => {
        
        const count = 10;

        await Array(count).fill(0).reduce( (acc, item)=> {
            return acc.then( () => this.service.createNewBlock()) 
        }, Promise.resolve())
        
        const state = await this.service.getState(this.service.coinbaseAddress); 

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

});