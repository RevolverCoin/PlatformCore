const mongoose = require('mongoose')
const BlockSchema = require('../../models/blockchain/block')
const StateSchema = require('../../models/blockchain/state')
const {
  Transaction: TransactionSchema, 
  PendingTransaction: PendingTransactionSchema
} = require('../../models/blockchain/transaction')



const { BlockchainServiceBase, State, Transaction } = require('./serviceBase')

class BlockchainServiceDatabase extends BlockchainServiceBase {
  constructor() {
    super()
  }

  async createState(address) {
    const stateSchema = new StateSchema({
      address,
      balance: 0,
      transactions: []
    })

    return stateSchema.save();
  }


  async updateState(address, newBalance, tx) {

    const txData = Object.assign({},tx)

    const txResult = await TransactionSchema.findOneAndUpdate({id: tx.id}, txData, {upsert: true, new: true});
    await StateSchema.update({ address }, {balance: newBalance, $push: { transactions: txResult._id } });
    return;
  }

  async getState(address) {
    const result = await StateSchema.findOne({address});
     
    return new State(
      address,
      result.balance,
      []
    )
  }
  async getStatesCount() {
    return StateSchema.countDocuments({});
  }

  async getHeight() {
    return BlockSchema.countDocuments({});
  }

  async addPendingTx(tx) {

    const pendingTxSchema = new PendingTransactionSchema(tx)
    return pendingTxSchema.save();
  }
  async getPendingTxs() {
    
    const pending = await PendingTransactionSchema.find({});
    
    const result = pending.map(value => {
      return new Transaction(
        value.addressFrom,
        value.addressTo,
        value.amount,
        value.type
      )
    })

    return result;
  }

  async registerNewBlock(block) {
    
    try {
      
      // bulk insert txs
      const result = await TransactionSchema.collection.insert(block.txs);  
      
      const insertedIds = result.ops.map(tx => tx.id);

      const objectIds = []
      Object.keys(result.insertedIds).forEach(key =>{
        objectIds.push(result.insertedIds[key]);
      })

      const blockSchema = new BlockSchema({
          height: block.height,
          transactions: objectIds
      })
      await blockSchema.save();
      
      // remove all handled pending txs
      await PendingTransactionSchema.deleteMany({id: {$in: insertedIds}});

    } catch(e) {console.log(e)}


  }
}

module.exports = BlockchainServiceDatabase
