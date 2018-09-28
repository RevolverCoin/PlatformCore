const {BlockchainServiceBase, State} = require('./serviceBase')


class BlockchainServiceMemory extends BlockchainServiceBase {
    constructor()
    {
        super();

        this.states = {};

        // list of blocks
        this.ledger     = [];

        // list of txs
        this.pendingTxs = [];        
    }


    async createState(address) {
        
        // do not allow state duplication
        let state =   await this.getState(address)
        if (state)
            return null;


        state = new State(address, 0, []);
        this.states[address] = state;
        
        return state;
    }    

    async getState(address)
    {
        if (!this.states.hasOwnProperty(address)) 
            return null;

        return this.states[address] 
    }

    async updateState(address, newBalance, tx)
    {
        const state = await this.getState(address) 
        if (!state)
            return;

        state.balance = newBalance;
        state.txs.push(tx); 
    }


    async getStatesCount()
    {
        return Object.keys(this.states).length
    }

    async addPendingTx(tx) {
        this.pendingTxs.push(tx);
    }
    
    async getHeight()
    {
        return this.ledger.length;
    }

    async getPendingTxs()
    {
        return this.pendingTxs;
    }

    async registerNewBlock(block)
    {
        this.ledger.push(block);

        // Pending could be changed during block creation. 
        // Remove only those that were written to block 
        this.pendingTxs = this.pendingTxs.filter( pendingTx  => {
            
            // if this tx recorded in the block - skip it
            const found = block.txs.find( blockTx => (blockTx.id === pendingTx.id))
            
            // if not found then return as a new pending
            return (found === 'undefined')
        } )
    }



}

module.exports = BlockchainServiceMemory;