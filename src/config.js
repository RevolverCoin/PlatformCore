const config = {
  PORT: process.env.PORT || 5447,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/platform-core',
  MONGO_TEST_URL: process.env.MONGO_TEST_URL || 'mongodb://localhost:27017/platform-core-test',
}

module.exports = config
