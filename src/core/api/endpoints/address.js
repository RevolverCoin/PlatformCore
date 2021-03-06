const express = require('express')

const config = require('../../blockchain/config')
const errors = require('../errors')

const Address = require('../../../models/address')
const Support = require('../../../models/support')

const blockchainService = require('../../blockchain/service')

const routes = express.Router()

/**
 * @api {post} /address/new CreateAddress
 * @apiName CreateAddress
 * @apiGroup Address
 *
 * @apiHeader {String} content-type application/json
 *
 * @apiParam {String} type User type (Supporter, Author, Generator, AuthorGenerator, etc)
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "type": "Author",
 *      "internal": false
 *  }
 *
 *
 * @apiSuccess {String} errorType type of the error, or noError if no error
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "error": "noError",
 *          "address" : "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82"
 *     }
 *
 * @apiError noError if call was successful
 * @apiError unknownError if error occurred during API call
 * @apiError invalidInputs bad address or type provided
 *
 */

routes.post('/address/new', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {
    const { type, internal } = request.body
    const requestData = { type, internal }

    // validate
    const valid = true
    if (!valid) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    // generate address
    const newAddress = await blockchainService.generateNewAddress()

    const data = Object.assign({ address: newAddress }, {type: requestData.type})

    // add address
    const result = await Address.create(data)
    if (result) {
      
      // if a common user, send bounty
      if (!requestData.internal) {
        const serviceAddress = await blockchainService.getServiceAddress()
        const sendResult = await blockchainService.send(serviceAddress, newAddress, config.addressStartBounty)
        if (!sendResult) {
          console.log(`Cannot send a start bounty from ${serviceAddress} to ${newAddress}`)
        }
      }

      responseData.error = errors.noError
      responseData.address = newAddress
    }

    response.json(responseData)
  } catch (e) {
    console.log(e)
    responseData.message = e.toString()
    response.json(responseData)
  }
})

/**
 * @api {post} /address AddAddress
 * @apiDeprecated use now (#Address:CreateAddress)
 * @apiName AddAddress
 * @apiGroup Address
 
 *
 * @apiHeader {String} content-type application/json
 *
 * @apiParam {String} address User address
 * @apiParam {String} type User type (Supporter, Author, Generator, AuthorGenerator, etc)
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "address": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82",
 *      "type": "Author",
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
 * @apiError addressAlreadyExists if address already exists
 * @apiError invalidInputs bad address or type provided
 *
 */

routes.post('/address', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }
  
  response.json(responseData)
})

/**
 * @api {patch} /address/:address UpdateDataByAddress
 * @apiName UpdateDataByAddress
 * @apiGroup Address
 *
 * @apiHeader {String} content-type application/json
 *
 * @apiParam (url){String} address User address
 * @apiParam (body){String} type User type (Supporter, Author, Generator, AuthorGenerator, etc)
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *           "type": "Author",
 *  }
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
 * @apiError addressAlreadyExists if address already exists
 * @apiError invalidInputs bad address or type provided
 *
 */

routes.patch('/address/:address', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {
    const address = request.params.address
    const valid = true

    if (!address || !valid) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }
    const { type } = request.body
    const requestData = { type }

    const result = await Address.findOneAndUpdate({ address }, { type: requestData.type })
    if (result) {
      responseData.error = errors.noError
    }

    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

/**
 * @api {get} /address/:address GetDataByAddress
 * @apiName GetDataByAddress
 * @apiGroup Address
 *
 *
 * @apiParam (url){String} address User address
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
 * @apiError addressNotFound specified address was not found
 *
 */
routes.get('/address/:address', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
  }

  try {
    const address = request.params.address

    // validate
    if (!address) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    const result = await Address.findOne({ address }, { _id: 0, type: 1 })

    responseData.error = errors.noError
    responseData.data = result
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }

})

/**
 * @api {get} /address/supporting/:address GetSupports
 * @apiName GetSupports
 * @apiGroup Address
 *
 *
 * @apiParam (url){String} address User address
 *
 * @apiSuccess {String} errorType type of the error, or noError if no error
 * @apiSuccess {String} data resulting data, containing supporters
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "error": "noError",
 *          "data": {
 *              supports: [
 *                  "addressTo": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82"
 *              ]
 *          }
 *     }
 *
 * @apiError noError if call was successful
 * @apiError unknownError if error occurred during API call
 * @apiError invalidInputs bad address provided
 *
 */
routes.get('/address/supporting/:address', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
    data: {},
  }

  try {
    const address = request.params.address

    // validate
    if (!address) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    const result = await Support.find({ addressFrom: address })
    const filteredResult = result.map(obj => {
      return {
        addressTo: obj.addressTo,
      }
    })

    responseData.error = errors.noError
    responseData.data = { supports: filteredResult }
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

/**
 * @api {get} /address/supported/:address GetSupporters
 * @apiName GetSupporters
 * @apiGroup Address
 *
 *
 * @apiParam (url){String} address User address
 *
 * @apiSuccess {String} errorType type of the error, or noError if no error
 * @apiSuccess {String} data resulting data, containing supporters
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "error": "noError",
 *          "data": {
 *              supports: [
 *                  "addressFrom": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82"
 *              ]
 *          }
 *     }
 *
 * @apiError noError if call was successful
 * @apiError unknownError if error occurred during API call
 * @apiError invalidInputs bad address provided
 *
 */
routes.get('/address/supported/:address', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
    data: {},
  }

  try {
    const address = request.params.address

    // validate
    if (!address) {
      responseData.error = errors.invalidInputs
      response.json(responseData)
      return
    }

    const result = await Support.find({ addressTo: address })
    const filteredResult = result.map(obj => {
      return {
        addressFrom: obj.addressFrom,
      }
    })

    responseData.error = errors.noError
    responseData.data = { supports: filteredResult }
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

/**
 * @api {get} /addresses GetAddresses
 * @apiName GetAddresses
 * @apiGroup Address
 *
 *
 * @apiSuccess {String} errorType type of the error, or noError if no error
 * @apiSuccess {String} data resulting data, containing all addresses
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "error": "noError",
 *          "data": [
 *                  ...
 *              ]
 *          }
 *     }
 *
 * @apiError noError if call was successful
 * @apiError unknownError if error occurred during API call
 *
 */
routes.get('/addresses', async (request, response) => {
  const responseData = {
    error: errors.unknownError,
    data: {},
  }

  try {
    const result = await Address.find()
    const preparedResult = result.map(obj => {
      return {
        address: obj._doc.address,
        type: obj._doc.type,
      }
    })

    responseData.error = errors.noError
    responseData.data = preparedResult
    response.json(responseData)
  } catch (e) {
    responseData.message = e.toString()
    response.json(responseData)
  }
})

module.exports = routes
