const bitcoin = require('bitcoinjs-lib')
const bs58check = require('bs58check')
const uuidv4 = require('uuid/v4')
const config = require('./config')

const TxType = {
  txCoinbase: 'txCoinbase',
  txNormal: 'txNormal',
}

class Transaction {
  constructor(addressFrom, addressTo, amount, type, id) {
    this.addressFrom = addressFrom
    this.addressTo = addressTo
    this.amount = amount
    this.type = type

    if (typeof id !== 'undefined') {
      this.id = id
    } else {
      // extend with random uuid
      const copy = Object.assign({}, this)
      copy['uuid'] = uuidv4()

      // calculate id
      this.id = bs58check.encode(bitcoin.crypto.sha256(new Buffer(JSON.stringify(copy))))
    }
  }
}

class Block {
  constructor(coinbaseTx, height) {
    this.txs = []
    this.txs.push(coinbaseTx)

    this.height = height
  }
}

class State {
  constructor(address, balance, txs) {
    this.address = address
    this.balance = balance
    this.txs = txs
  }
}

class BlockchainServiceBase {
  constructor() {
    this.coinbaseAddress = null
  }

  async createState(address) {
    throw new Error('not implemented')
  }
  async updateState(address, newBalance, tx) {
    throw new Error('not implemented')
  }
  async getState(address) {
    throw new Error('not implemented')
  }
  async getStatesCount() {
    throw new Error('not implemented')
  }

  async getHeight() {
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

  async getServiceAddress() {
    return this.coinbaseAddress
  }

  async generateNewAddress() {
    try {
      // generate
      const network = bitcoin.networks.bitcoin
      const xpub =
        'xpub6AHA9hZDN11k2ijHMeS5QqHx2KP9aMBRhTDqANMnwVtdyw2TDYRmF8PjpvwUFcL1Et8Hj59S3gTSMcUQ5gAqTz3Wd8EsMTmF3DChhqPQBnU'

      const root = bitcoin.bip32.fromBase58(xpub, network)

      //
      const statesCount = await this.getStatesCount()

      const path = statesCount.toString()

      const child = root.derivePath(path)
      const address = bitcoin.payments.p2pkh({ pubkey: child.publicKey, network }).address

      // register in state
      await this.createState(address)

      // the first address is a coinbase address
      if (!this.coinbaseAddress) this.coinbaseAddress = address

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

    return true
  }

  async createNewBlock() {
    try {
      console.log('# Blockchain Service: new block')

      // create coinbase tx
      const coinbaseTx = new Transaction(
        null,
        this.coinbaseAddress,
        config.blockReward,
        TxType.txCoinbase,
      )

      const height = await this.getHeight()

      // create block
      const block = new Block(coinbaseTx, height)

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

      await this.registerNewBlock(block)
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * Update state with this tx
   * @param {Transaction} Tx
   */
  async executeTx(/*Transaction*/ tx) {
    try {
      let stateFrom = null

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
      let stateTo = await this.getState(tx.addressTo)
      if (!stateTo) stateTo = await this.createState(tx.addressTo)

      // update only for normal tx
      if (tx.type === TxType.txNormal) {
        // update from state
        await this.updateState(stateFrom.address, stateFrom.balance - tx.amount, tx)
      }

      // update to state
      await this.updateState(stateTo.address, stateTo.balance + tx.amount, tx)

      return true
    } catch (e) {
      console.log(e)
    }
  }

  startDaemon() {
    if (this.miner) return

    this.miner = setInterval(() => {
      this.createNewBlock()
    }, config.blockTime)
  }

  stopDaemon() {
    if (this.miner) clearInterval(this.miner)

    this.miner = null
  }
}

module.exports = { BlockchainServiceBase, config, TxType, State, Block, Transaction }
