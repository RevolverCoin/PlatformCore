let mongoose = require('mongoose');

let blockSchema = mongoose.Schema({
    height          : Number,
    time            : { type : Date, default: Date.now },
    transactions    : [{type: mongoose.Schema.Types.ObjectId, ref: 'Transaction'}]
});

module.exports = mongoose.model('Block', blockSchema);
