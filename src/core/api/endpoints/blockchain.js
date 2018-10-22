const express = require('express')

const errors = require('../errors')

const State = require('../../../models/blockchain/state')
const {Transaction} = require('../../../models/blockchain/transaction')

const blockchainService = require('../../blockchain/service')

const routes = express.Router()

/**
 * @api {get} /blockchain/info GetBlockchainInfo
 * @apiName GetBlockchainInfo
 * @apiGroup Blockchain
 *
 * @apiHeader {String} content-type application/json
 * 
 * @apiSuccess {String} errorType type of the error, or noError if no error
 * @apiSuccess {String} data resulting data, containing info
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "error": "noError",
 *          "data": {
 *              height: 325,  
 *              serviceAddress: '13mNf2rNDcVMhNZehRpKJbyLLc3ftpsy3z',
 *              serviceBalance: 740
 *  *          }
 *     }
 *
 * @apiError noError if call was successful 
 * @apiError unknownError if error occurred during API call
 * 
 */
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


/**
 * @api {get} /blockchain/state GetBlockchainState
 * @apiName GetBlockchainState
 * @apiGroup Blockchain
 *
 * @apiHeader {String} content-type application/json
 * 
 * @apiSuccess {String} errorType type of the error, or noError if no error
 * @apiSuccess {String} data resulting data, containing info
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "error": "noError",
 *          "data": [
 *             {
 *              address: '13mNf2rNDcVMhNZehRpKJbyLLc3ftpsy3z',
 *              balance: 740
 *             },
 *             {
 *              address: '13mNf2rNDcVMhNZehRpKJbyLLc3ftpsy3z',
 *              balance: 740
 *             }
 *          ]
 *     }
 *
 * @apiError noError if call was successful 
 * @apiError unknownError if error occurred during API call
 * 
 */
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

/**
 * @api {get} /blockchain/:address/balance GetBlockchainBalance
 * @apiName GetBlockchainBalance
 * @apiGroup Blockchain
 *
 * @apiHeader {String} content-type application/json
 * 
 * @apiParam (url){String} address User address
 * 
 * @apiSuccess {String} errorType type of the error, or noError if no error
 * @apiSuccess {String} data resulting data, containing info
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "error": "noError",
 *          "data": 740
 *     }
 *
 * @apiError noError if call was successful 
 * @apiError unknownError if error occurred during API call
 * @apiError invalidInputs bad address provided
 * 
 */
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


/**
 * @api {get} /blockchain/:address/transactions GetBlockchainTransactions
 * @apiName GetBlockchainTransactions
 * @apiGroup Blockchain
 *
 * @apiHeader {String} content-type application/json
 * 
 * @apiParam (url){String} address User address
 * 
 * @apiSuccess {String} errorType type of the error, or noError if no error
 * @apiSuccess {String} data resulting data, containing info
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "error": "noError",
 *          "data": [
 *            {}
 *          ]
 *     }
 *
 * @apiError noError if call was successful 
 * @apiError unknownError if error occurred during API call
 * @apiError invalidInputs bad address provided
 * 
 */
routes.get('/blockchain/:address/transactions', async (request, response) => {
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

    const result = await Transaction.find(
      {$or: [{addressFrom: address}, {addressTo: address}] }, 
      null, 
      { limit: 100,  sort:{ blockHeight: -1}}
    )

    responseData.data = result
    responseData.error = errors.noError

    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})


/**
 * @api {post} /blockchain/send Send
 * @apiName Send
 * @apiGroup Blockchain
 
 *
 * @apiHeader {String} content-type application/json
 *
 * @apiParam {String} addressFrom From address
 * @apiParam {String} addressTo To address
 * @apiParam {Number} amount
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "addressFrom": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82",
 *      "addressTo": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82",
 *      "amount": 10
 *  }
 *
 *
 * @apiSuccess {String} errorType type of the error, or noError if no error
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "error": "noError"
 *     }
 *
 * @apiError noError if call was successful 
 * @apiError unknownError if error occurred during API call
 * @apiError invalidInputs bad address or type provided
 *
 */
routes.post('/blockchain/send', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {
    const requestData = ({ addressFrom, addressTo, amount } = request.body)
   
    // validate
    const valid = true
    if (!valid) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    await blockchainService.send(requestData.addressFrom, requestData.addressTo, parseInt(requestData.amount))

    responseData.error = errors.noError
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

module.exports = routes
