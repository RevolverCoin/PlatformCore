const mongoose = require('mongoose')
const BlockSchema = require('../../models/blockchain/block')
const StateSchema = require('../../models/blockchain/state')
const {
  Transaction: TransactionSchema,
  PendingTransaction: PendingTransactionSchema,
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
      transactions: [],
    })

    return stateSchema.save()
  }

  async updateState(address, newBalance, tx) {
    const txData = Object.assign({}, tx)

    // create tx in db 
    const txResult = await TransactionSchema.findOneAndUpdate({ id: tx.id }, txData, {
      upsert: true,
      new: true,
    })

    // update state and add tx ref
    await StateSchema.update(
      { address },
      { balance: newBalance, $push: { transactions: txResult._id } },
    )

    return
  }

  async getState(address) {
    const result = await StateSchema.findOne({ address })

    return new State(address, result.balance, [])
  }
  async getStatesCount() {
    return StateSchema.countDocuments({})
  }

  async getHeight() {
    return BlockSchema.countDocuments({})
  }

  async addPendingTx(tx) {
    const pendingTxSchema = new PendingTransactionSchema(tx)
    return pendingTxSchema.save()
  }
  async getPendingTxs() {
    const pending = await PendingTransactionSchema.find({})

    const result = pending.map(value => {
      return new Transaction(value.addressFrom, value.addressTo, value.amount, value.type, value.id)
    })

    return result
  }

  async registerNewBlock(block) {
    try {
      // all txs already in db during state updates
      const txIdsInBlock = block.txs.map(tx => tx.id)

      // get object ids
      const txs = await TransactionSchema.find({ id: { $in: txIdsInBlock } })
      const objectIds = txs.map(tx => tx._id)

      const blockSchema = new BlockSchema({
        height: block.height,
        transactions: objectIds,
      })
      await blockSchema.save()
      
      // remove all handled pending txs
      await PendingTransactionSchema.deleteMany({ id: { $in: txIdsInBlock } })
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = BlockchainServiceDatabase
