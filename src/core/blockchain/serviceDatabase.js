
const BlockModel = require('../../models/blockchain/block')
const StateModel = require('../../models/blockchain/state')
const ServiceModel = require('../../models/blockchain/service')

const AddressModel = require('../../models/address')

const {
  Transaction: TransactionSchema,
  PendingTransaction: PendingTransactionSchema,
} = require('../../models/blockchain/transaction')

const { BlockchainServiceBase, State } = require('./serviceBase')
const {Transaction} = require('./transaction')

class BlockchainServiceDatabase extends BlockchainServiceBase {
  constructor() {
    super()
  }

  async createState(address) {
    const stateSchema = new StateModel({
      address,
      balance: 0,
      lockedBalance: 0,
      transactions: [],
    })

    return stateSchema.save()
  }

  async updateStateBalance(address, newBalance, tx, locked) {
    const txData = Object.assign({}, tx)

    // create tx in db 
    const txResult = await TransactionSchema.findOneAndUpdate({ id: tx.id }, txData, {
      upsert: true,
      new: true,
    })

    // update state and add tx ref
    let balanceProperty = locked ? 'lockedBalance' : 'balance' 
    
    await StateModel.update(
      { address },
      { [balanceProperty]: newBalance, $push: { transactions: txResult._id } },
    )

    return
  }


  async getState(address) {
    const result = await StateModel.findOne({ address })

    return new State(address, result.balance, result.lockedBalance, [])
  }
  async getStatesCount() {
    return StateModel.countDocuments({})
  }

  async getHeight() {
    return BlockModel.countDocuments({})
  }

  async getBlockInfo(height) {
    const block = await BlockModel
      .findOne({ height }, {height:1, time:1, _id:0}, {lean:true})
      .populate('transactions', {_id:0, id:1})
    
      return block;
  }


  async getServiceAddress() {
    const serviceInfo = await ServiceModel.findOne();
    if (!serviceInfo)
      return null;
    
    return serviceInfo.address;
  }
  
  async setServiceAddress(address) {
    await ServiceModel.create({address});
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

      const blockSchema = new BlockModel({
        height: block.height,
        transactions: objectIds,
      })
      await blockSchema.save()
      
      // remove all handled pending txs
      await PendingTransactionSchema.deleteMany({ id: { $in: txIdsInBlock } })

      // update blockHeight for txs
      await TransactionSchema.updateMany({ id: { $in: txIdsInBlock } }, { $set: { "blockHeight" : block.height } })
    } catch (e) {
      console.log(e)
    }
  }

  async onClaimGenerator(address, claim) {
    try {

      const type = claim ? 'Generator' : 'Supporter'
      await AddressModel.findOneAndUpdate({ address }, { type })

    } catch(e) {
      console.log(e)
    }

  }
}

module.exports = BlockchainServiceDatabase
