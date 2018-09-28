let mongoose = require('mongoose');

let ledgerSchema = mongoose.Schema({
    coinbaseAddress : String,
    blocks          : [{type: Schema.ObjectId, ref: 'Block'}],
    states          : [{type: Schema.ObjectId, ref: 'State'}],
});

module.exports = mongoose.model('Ledger', ledgerSchema);
