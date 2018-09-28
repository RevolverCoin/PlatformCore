
const addressRoutes = require('../api/endpoints/address')
const supportRoutes = require('../api/endpoints/support')
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
}
