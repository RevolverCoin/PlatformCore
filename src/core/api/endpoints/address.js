const express = require('express')

const Address = require('../../../models/address')
const Support = require('../../../models/support')
const routes = express.Router()

const errors = require('../errors')

/**
 * @api {post} /address AddAddress
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

    try {
        const requestData = ({ address, type } = request.body)

        // verify if support does not exists
        const documents = await Address.find({ address: requestData.address })
        if (documents && documents.length > 0) {
            responseData.error = errors.addressAlreadyExists
            response.json(responseData)
            return
        }

        // validate
        const valid = true
        if (!valid) {
            responseData.error = errors.invalidInputs
            response.json(responseData)
            return
        }

        // add address
        const result = await Address.create(requestData)
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

        const requestData = ({ type } = request.body)

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
    const address = request.params.address

    if (address) {
        Address.find({
            address,
        }).exec((error, documents) => {
            if (documents && documents.length > 0) {
                responseData.data = documents[0]
                responseData.error = errors.noError
            } else {
                responseData.error = errors.addressNotFound
            }
            response.json(responseData)
        })
    } else {
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
        data: {}
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
                addressTo : obj.addressTo
            } 
        })

        responseData.error  = errors.noError
        responseData.data   = {supports: filteredResult}
        response.json(responseData)
    } catch (e) {
        responseData.message = e.toString()
        response.json(responseData)
    }

})

/**
 * @api {get} /address/supporting/:address GetSupporters
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
        data: {}
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
                addressFrom : obj.addressFrom
            } 
        })

        responseData.error  = errors.noError
        responseData.data   = {supports: filteredResult}
        response.json(responseData)
    } catch (e) {
        responseData.message = e.toString()
        response.json(responseData)
    }

})

module.exports = routes
