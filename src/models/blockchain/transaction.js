let mongoose = require('mongoose');

let transactionSchema = mongoose.Schema({
    addressFrom     : String,
    addressTo       : String,
    amount          : Number,
    type            : String,       
    id              : String
});

module.exports = {
    Transaction: mongoose.model('Transaction', transactionSchema),
    PendingTransaction: mongoose.model('PendingTransaction', transactionSchema)
}
