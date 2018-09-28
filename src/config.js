const config = {
  PORT: process.env.PORT || 5445,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/platform',
  MONGO_TEST_URL: process.env.MONGO_TEST_URL || 'mongodb://localhost:27017/platform-test',
}

module.exports = config
