let mongoose = require('mongoose');

let stateSchema = mongoose.Schema({
    address         : { type:String, unique : true, required : true, dropDups: true},
    balance         : Number,
    lockedBalance   : Number, 
    transactions    : [{type: mongoose.Schema.Types.ObjectId, ref: 'Transaction'}]
});

module.exports = mongoose.model('State', stateSchema);
