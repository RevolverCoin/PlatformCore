const bitcoin = require('bitcoinjs-lib')
const Bottleneck = require('bottleneck')
const config = require('./config')
const { Transaction, TxType } = require('./transaction')
const rewardSystem = require('../reward/reward')


class Block {
  constructor(coinbaseTx, rewardTxs, height) {
    this.txs = []
    this.txs.push(coinbaseTx)
    this.txs = this.txs.concat(rewardTxs)

    this.height = height
  }
}

class State {
  constructor(address, balance, lockedBalance, txs) {
    this.address = address
    this.balance = balance
    this.lockedBalance = lockedBalance
    this.txs = txs
  }
}

/** block async calls to DB */
const limiter = new Bottleneck({
  maxConcurrent: 1,
});


class BlockchainServiceBase {
  constructor() {
    this.coinbaseAddress = null
    this.generateNewAddress = limiter.wrap(this.generateNewAddress.bind(this)); 
  }

  async createState(address) {
    throw new Error('not implemented')
  }
  async updateStateBalance(address, newBalance, tx, locked) {
    throw new Error('not implemented')
  }
  async updateStateLockedBalance(address, newLockedBalance, tx) {
    throw new Error('not implemented')
  }

  async getState(address) {
    throw new Error('not implemented')
  }
  async getStatesCount() {
    throw new Error('not implemented')
  }

  /**
   * Height is a count of registered blocks
   * In terms of block index - it points to the index of upcoming block
   */
  async getHeight() {
    throw new Error('not implemented')
  }

  /**
   * get extended block info
   * return {height, time, transactions: [{id, type}]}
   */
  async getBlockInfo(height) {
    throw new Error('not implemented')
  }

  async addPendingTx(tx) {
    throw new Error('not implemented')
  }
  async getPendingTxs() {
    throw new Error('not implemented')
  }

  async registerNewBlock(block) {
    throw new Error('not implemented')
  }

  async onClaimGenerator(address, claim)
  {
    throw new Error('not implemented')
  }

  async onSupport(addressFrom, addressTo, add)
  {
    throw new Error('not implemented')
  }

  async getServiceAddress() {
    return this.coinbaseAddress
  }

  async setServiceAddress(address) {
    this.coinbaseAddress = address
  }

  async init() {
    this.coinbaseAddress = await this.getServiceAddress()
    if (!this.coinbaseAddress) {
      const address = await this.generateNewAddress()
      await this.setServiceAddress(address)
      this.coinbaseAddress = address
    }
  }

  async generateNewAddress() {
    try {
      // generate
      const network = bitcoin.networks.bitcoin
      const xpub =
        'xpub6AHA9hZDN11k2ijHMeS5QqHx2KP9aMBRhTDqANMnwVtdyw2TDYRmF8PjpvwUFcL1Et8Hj59S3gTSMcUQ5gAqTz3Wd8EsMTmF3DChhqPQBnU'

      const root = bitcoin.bip32.fromBase58(xpub, network)

      const statesCount = await this.getStatesCount()

      const path = statesCount.toString()

      const child = root.derivePath(path)
      const address = 'SIM' + bitcoin.payments.p2pkh({ pubkey: child.publicKey, network }).address

      // register in state
      await this.createState(address)

      console.log('# Blockchain Service: new address ', address)
      return address
    } catch (e) {
      console.log(e)
      return null
    }
  }

  async send(addressFrom, addressTo, amount) {
    // verify from address - address should exist
    const stateFrom = await this.getState(addressFrom)
    if (!stateFrom) return false

    // check balance addressFrom
    if (!stateFrom.balance || stateFrom.balance < amount) return false

    // check amount
    if (amount <= 0) return false

    // create pending tx
    const tx = new Transaction(addressFrom, addressTo, amount, TxType.txNormal)

    await this.addPendingTx(tx)
    await this.createNewBlock()


    return true
  }

  /**
   * Add support
   * @param {address} addressFrom 
   * @param {address} addressTo 
   * @param {boolean} add 
   */
  async addSupport(addressFrom, addressTo, add) {
    // verify address - address should exist
    const stateFrom = await this.getState(addressFrom)
    if (!stateFrom) return false

    const stateTo = await this.getState(addressTo)
    if (!stateTo) return false

    // check balance
    if (add && (!stateFrom.balance || stateFrom.balance < config.supportCost)) return false
    if (!add && (!stateFrom.lockedBalance || stateFrom.lockedBalance < config.supportCost)) return false

    // check pending tx
    // only one claim can be in mem pool
    const pending = await this.getPendingTxs()

    const found = pending.find(tx => {
      return (tx.addressFrom === addressFrom && tx.addressTo === addressTo  && tx.type === TxType.txSupport)
    })    

    if (typeof found !== 'undefined') 
      return false;

    // create pending tx
    const tx = new Transaction(
      addressFrom,
      addressTo,
      add ? config.supportCost : 0,
      TxType.txSupport,
    )
    
    await this.addPendingTx(tx)
    await this.createNewBlock()

    return true
  }

  async claimGenerator(address, claim) {

    // verify address - address should exist
    const state = await this.getState(address)
    if (!state) return false

    // check balance
    if (claim) {
      if (!state.balance || state.balance < config.claimGeneratorAmount) return false
    } else {
      if (!state.lockedBalance || state.lockedBalance < config.claimGeneratorAmount) return false
    }

    // check pending tx
    // only one claim can be in mem pool
    const pending = await this.getPendingTxs()

    const found = pending.find(tx => {
      return (tx.type === TxType.txClaimGenerator) && (tx.addressFrom === address || tx.addressTo === address) 
    })

    if (typeof found !== 'undefined') 
      return false;

    // todo: check if it is not a generator
    // ...

    // claim: {addressFrom, addressTo} => {null, address}
    // unclaim: {addressFrom, addressTo} => {address, null}
    const addressFrom = claim ? null : address
    const addressTo = claim ? address : null

    // create pending tx
    const tx = new Transaction(
      addressFrom,
      addressTo,
      config.claimGeneratorAmount,
      TxType.txClaimGenerator,
    )

    await this.addPendingTx(tx)
    await this.createNewBlock()

    return true
  }

  async checkPendingAndMine()
  {
    try {
      const pendingTxs = await this.getPendingTxs()
      if (pendingTxs && pendingTxs.length > 0)
        this.createNewBlock()

    } catch(e){
      console.log(e)
    }
  }

  async createNewBlock() {
    try {
      if (!this.coinbaseAddress) throw new Error('Service address error!')

      const height = await this.getHeight()
      
      const blockReward = (height === 0) ? config.blockGenesisReward : config.blockReward 

      // create coinbase tx
      const coinbaseTx = new Transaction(
        null,
        this.coinbaseAddress,
        blockReward,
        TxType.txCoinbase,
      )

      
      // generate rewards
      const rewardsResult = await rewardSystem.processRewards(config.distributeReward)

      // create rewardTxs
      const rewardTxs = rewardsResult.rewards.map(item => {
        return new Transaction(rewardsResult.generator, item.address, item.reward, TxType.txReward)
      })

      // create block
      const block = new Block(coinbaseTx, rewardTxs, height)

      const pendingTxs = await this.getPendingTxs()

      if (pendingTxs.length > 0) console.log(`${pendingTxs.length} txs processed`)

      // write pending tx
      pendingTxs.forEach(tx => {
        block.txs.push(tx)
      })

      // process blocks synchronously
      await block.txs.reduce((p, tx) => {
        return p.then(() => this.executeTx(tx))
      }, Promise.resolve())

      console.log('# Blockchain Service: new block #' + height)

      await this.registerNewBlock(block)
    } catch (e) {
      console.log(e)
    }
  }

  /******************************************************************************************
   * Update state with this tx
   * @param {Transaction} Tx
   ******************************************************************************************/
  async executeTx(/*Transaction*/ tx) {
    try {
      let stateFrom = null
      let stateTo = null

      // Claim Generator
      if (tx.type === TxType.txClaimGenerator) {

        //check amount
        if (tx.amount !== config.claimGeneratorAmount) return false

        // claim? 
        if (tx.addressTo !== null) {

          if (tx.addressFrom !== null)
            return false

          stateTo = await this.getState(tx.addressTo)
          if (!stateTo) return false
          
          // check balance
          if (!stateTo.balance || stateTo.balance < config.claimGeneratorAmount) return false

          await this.updateStateBalance(stateTo.address, stateTo.balance - config.claimGeneratorAmount, tx, false)
          await this.updateStateBalance(stateTo.address, stateTo.lockedBalance + config.claimGeneratorAmount, tx, true)

          await this.onClaimGenerator(stateTo.address, true);

        } else {

          if (tx.addressFrom === null)
            return false

          stateFrom = await this.getState(tx.addressFrom)
          if (!stateFrom) return false
  
          // check balance
          if (!stateFrom.lockedBalance || stateFrom.lockedBalance < config.claimGeneratorAmount) return false

          await this.updateStateBalance(stateFrom.address, stateFrom.lockedBalance - config.claimGeneratorAmount, tx, true)
          await this.updateStateBalance(stateFrom.address, stateFrom.balance + config.claimGeneratorAmount, tx, false)

          await this.onClaimGenerator(stateFrom.address, false);
        }
      
        
        return true;


      } else 
      // Tx Support
      if (tx.type === TxType.txSupport) {
        
        stateFrom = await this.getState(tx.addressFrom)
        if (!stateFrom) return false
        
        stateTo = await this.getState(tx.addressTo)
        if (!stateTo) return false

        // if add support
        if (tx.amount === config.supportCost) {
          if (!stateFrom.balance || stateFrom.balance < config.supportCost) return false

          await this.updateStateBalance(stateFrom.address, stateFrom.balance - config.supportCost, tx, false)
          await this.updateStateBalance(stateFrom.address, stateFrom.lockedBalance + config.supportCost, tx, true)

          await this.onSupport(stateFrom.address, stateTo.address, true);

        } else { // if remove
          if (!stateFrom.lockedBalance || stateFrom.lockedBalance < config.supportCost) return false

          await this.updateStateBalance(stateFrom.address, stateFrom.lockedBalance - config.supportCost, tx, true)
          await this.updateStateBalance(stateFrom.address, stateFrom.balance + config.supportCost, tx, false)
        
          await this.onSupport(stateFrom.address, stateTo.address, false);
        }

        return true;
      }

      // check addressFrom only for normal tx
      if (tx.type === TxType.txNormal) {
        // verify from address - address should exist
        stateFrom = await this.getState(tx.addressFrom)
        if (!stateFrom) return false

        // check balance addressFrom
        if (!stateFrom.balance || stateFrom.balance < tx.amount) return false
      }

      //check amount
      if (tx.amount <= 0) return false

      // check to address - if it is not found in state - create
      stateTo = await this.getState(tx.addressTo)
      if (!stateTo) stateTo = await this.createState(tx.addressTo)

      // update only for normal tx
      if (tx.type === TxType.txNormal) {
        // update from state
        await this.updateStateBalance(stateFrom.address, stateFrom.balance - tx.amount, tx, false)
      }

      // update to state
      await this.updateStateBalance(stateTo.address, stateTo.balance + tx.amount, tx, false)

      return true
    } catch (e) {
      console.log(e)
    }
  }

  async startDaemon() {
    if (this.miner) return

    this.miner = setInterval(() => {
      this.createNewBlock()
    }, config.blockTime)

  }

  async stopDaemon() {
    if (this.miner) clearInterval(this.miner)

    this.miner = null
  }
}

module.exports = { BlockchainServiceBase, config, State, Block }
