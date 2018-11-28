const mongoose = require('mongoose');

let RewardSchema = mongoose.Schema({
  address: String,
  linkAddress: String,
  rewardTotal: Number
});


module.exports = mongoose.model('reward', RewardSchema);
