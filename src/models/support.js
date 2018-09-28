const mongoose = require('mongoose');

let SupportSchema = mongoose.Schema({
  addressFrom: String,
  addressTo: String,
});


module.exports = mongoose.model('supports', SupportSchema);
