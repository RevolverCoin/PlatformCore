let mongoose = require('mongoose');

let addressSchema = mongoose.Schema({
    address     : String,
    type        : String
});

module.exports = mongoose.model('Address', addressSchema);
