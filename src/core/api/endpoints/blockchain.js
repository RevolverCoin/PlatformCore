const express = require('express')

const errors = require('../errors')

const State = require('../../../models/blockchain/state')

const blockchainService = require('../../blockchain/service')

const routes = express.Router()

routes.get('/blockchain/info', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {
    const height = await blockchainService.getHeight()
    const serviceAddress = await blockchainService.getServiceAddress()
    const state = await blockchainService.getState(serviceAddress)


    responseData.data = {height, serviceAddress, serviceBalance:state.balance }
    responseData.error = errors.noError

    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

routes.get('/blockchain/state', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {
    const states = await State.find()

    const result = states.map(state => ({ address: state.address, balance: state.balance }))

    responseData.data = result
    responseData.error = errors.noError

    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

routes.get('/blockchain/:address/balance', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {
    const address = request.params.address

    // validate
    const valid = true
    if (!valid) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    const [result] = await State.find({ address })

    responseData.data = result.balance
    responseData.error = errors.noError

    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

routes.post('/blockchain/send', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {
    const requestData = ({ addressFrom, addressTo, amount } = request.body)
   
    await blockchainService.send(requestData.addressFrom, requestData.addressTo, parseInt(requestData.amount))

    responseData.error = errors.noError
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

module.exports = routes
