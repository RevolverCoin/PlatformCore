const bitcoin = require('bitcoinjs-lib')
const bs58check = require('bs58check')
const uuidv4 = require('uuid/v4')

const TxType = {
  txCoinbase: 'txCoinbase',
  txNormal: 'txNormal',
  txReward: 'txReward',
  txClaimGenerator: 'txClaimGenerator'
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

module.exports = { TxType, Transaction }
