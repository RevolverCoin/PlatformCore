let mongoose = require('mongoose');

let transactionSchema = mongoose.Schema({
    addressFrom     : String,
    addressTo       : String,
    amount          : Number,
    type            : String,       
    id              : { type:String, unique : true, required : true},
});

module.exports = {
    Transaction: mongoose.model('Transaction', transactionSchema),
    PendingTransaction: mongoose.model('PendingTransaction', transactionSchema)
}
