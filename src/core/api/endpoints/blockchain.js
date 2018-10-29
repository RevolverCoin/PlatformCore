const express = require('express')

const errors = require('../errors')

const State = require('../../../models/blockchain/state')
const { Transaction } = require('../../../models/blockchain/transaction')

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

    responseData.data = { height, serviceAddress, serviceBalance: state.balance }
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
 *              balance: 740,
 *              type: 'undefined'
 *             },
 *             {
 *              address: '13mNf2rNDcVMhNZehRpKJbyLLc3ftpsy3z',
 *              balance: 740,
 *              type: 'Supporter'
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

    const height = await blockchainService.getHeight() 
    await blockchainService.getBlockInfo(height-1)


    const states = await State.aggregate([
      {
        $lookup: {
          from: 'addresses',
          localField: 'address',
          foreignField: 'address',
          as: 'addressExtended',
        },
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: [{ $arrayElemAt: ['$addressExtended', 0] }, '$$ROOT'] },
        },
      },
      {
        $lookup: {
          from: 'supports',
          localField: 'address',
          foreignField: 'addressFrom',
          as: 'sing',
        },
      },
      {
        $lookup: {
          from: 'supports',
          localField: 'address',
          foreignField: 'addressTo',
          as: 'sed',
        },
      },

      {
        $project: {
          _id: 0,
          address: 1,
          balance: 1,
          type: 1,
          sing: { $size: '$sing' },
          sed: { $size: '$sed' },
        },
      },
    ])

    responseData.data = states
    responseData.error = errors.noError

    response.json(responseData)
  } catch (e) {
    console.log(e)
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

    const result = await State.findOne({ address }, {_id: 0, balance:1, lockedBalance: 1})

    responseData.data = result
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
      { $and: [
        { $or: [{ addressFrom: address }, { addressTo: address }] },
        { type: {$ne: 'txReward'}}
      ]},

      null,
      { limit: 100, sort: { blockHeight: -1 } },
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
 * @api {get} /blockchain/:address/rewardtransactions GetBlockchainRewardTransactions
 * @apiName GetBlockchainRewardTransactions
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
routes.get('/blockchain/:address/rewardtransactions', async (request, response) => {
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
      { $and: [
        { $or: [{ addressFrom: address }, { addressTo: address }] },
        { type: 'txReward'}
      ]},
      null,
      { limit: 100, sort: { blockHeight: -1 } },
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

    const { addressFrom, addressTo, amount } = request.body
    const requestData = {addressFrom, addressTo, amount}

    // validate
    const valid = true
    if (!valid) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    await blockchainService.send(
      requestData.addressFrom,
      requestData.addressTo,
      parseInt(requestData.amount),
    )

    responseData.error = errors.noError
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

/**
 * @api {post} /blockchain/claimgenerator ClaimGenerator
 * @apiName ClaimGenerator
 * @apiGroup Blockchain
 
 *
 * @apiHeader {String} content-type application/json
 *
 * @apiParam {String} address
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "address": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82"
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
routes.post('/blockchain/claimgenerator', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {

    const { address } = request.body
    const requestData = {address}

    // validate
    const valid = true
    if (!valid) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    await blockchainService.claimGenerator(
      requestData.address,
      true
    )

    responseData.error = errors.noError
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

/**
 * @api {post} /blockchain/unclaimgenerator UnclaimGenerator
 * @apiName UnclaimGenerator
 * @apiGroup Blockchain
 
 *
 * @apiHeader {String} content-type application/json
 *
 * @apiParam {String} address
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "address": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82"
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
routes.post('/blockchain/unclaimgenerator', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {

    const { address } = request.body
    const requestData = {address}

    // validate
    const valid = true
    if (!valid) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    await blockchainService.claimGenerator(
      requestData.address,
      false
    )

    responseData.error = errors.noError
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})






module.exports = routes
