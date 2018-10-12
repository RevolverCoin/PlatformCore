let mongoose = require('mongoose');

let serviceSchema = mongoose.Schema({
    address         : String
});

module.exports = mongoose.model('Service', serviceSchema);
