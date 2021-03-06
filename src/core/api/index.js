
const addressRoutes = require('../api/endpoints/address')
const supportRoutes = require('../api/endpoints/support')
const blockchainRoutes = require('../api/endpoints/blockchain')
const serviceRoutes = require('../api/endpoints/service')
const rewardRoutes = require('../api/endpoints/reward')


const {
  createSuccessResponse
} = require('../utils/utils')

module.exports = function (app) {
  app
    .get('/', (req, res) => res.status(200).json({
      'its: ': 'alive'
    }))
    .get('/die', () => process.exit(0))
    .use(addressRoutes)
    .use(supportRoutes)
    .use(blockchainRoutes)
    .use(serviceRoutes)
    .use(rewardRoutes)
}
