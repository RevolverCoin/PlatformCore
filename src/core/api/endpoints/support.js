const express = require('express')
const mongoose = require('mongoose')

const Support = require('../../../models/support')
const Address = require('../../../models/address')

const errors = require('../errors')

const routes = express.Router()

/**
 * @api {post} /support AddSupport
 * @apiName AddSupport
 * @apiGroup Support
 *
 * @apiHeader {String} content-type application/json
 *
 * @apiParam {String} addressFrom User address who creates support
 * @apiParam {String} addressTo User address who is supported
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "addressFrom": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82",
 *      "addressTo": "15sHcZzPuq6cAHuoto4kjG9eRjExzrtxJs",
 *  }
 *
 *
 * @apiSuccess {Boolean} success Success flag
 * @apiSuccess {String} errorType type of the error, or empty if no error
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "error": "noError"
 *     }
 * @apiError noError if call was successful 
 * @apiError unknownError if error occurred during API call
 * @apiError supportAlreadyExists if support already exists
 * @apiError invalidInputs bad addressFrom or addressTo provided
 * @apiError addressNotFound specified address was not found
 *
 */
routes.post('/support', async (request, response) => {
    const responseData = {
        error: errors.unknownError,
    }
    try {

        const { addressFrom, addressTo} = request.body
        const requestData = {addressFrom, addressTo}

        // verify if support does not exists
        let documents = await Support.find(requestData)
        if (documents && documents.length > 0) {
            responseData.error = errors.supportAlreadyExists
            response.json(responseData)
            return
        }

        // check if addressFrom exists
        documents = await Address.find({address:requestData.addressFrom})
        if (!documents || documents.length <= 0) {
            responseData.error = errors.addressFromNotFound
            response.json(responseData)
            return
        }
        // check if addressTo is exists
        const addressToDocument = await Address.find({address:requestData.addressTo})
        if (!addressToDocument || addressToDocument.length <= 0) {
            responseData.error = errors.addressToNotFound
            response.json(responseData)
            return
        }

        // validate address types and addresses
        const valid = true
        if (!valid) {
            responseData.error = errors.invalidInputs
            response.json(responseData)
            return
        }
        
        // add support
        const result = await Support.create(requestData)
        if (result) {
            responseData.error = errors.noError
        }
        

        response.json(responseData)
    } catch (e) {
        console.log(e)
        responseData.message = e.toString()
        response.json(responseData)
    }
})
/**
 * @api {delete} /support DeleteSupport
 * @apiName RemoveSupport
 * @apiGroup Support
 *
 * @apiHeader {String} content-type application/json
 *
 * @apiParam {String} addressFrom User address who creates support
 * @apiParam {String} addressTo User address who is supported
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "addressFrom": "17wWUwLaE4ACw5wc77RdutVSeJHQp8ti82",
 *      "addressTo": "15sHcZzPuq6cAHuoto4kjG9eRjExzrtxJs",
 *  }
 *
 *
 * @apiSuccess {Boolean} success Success flag
 * @apiSuccess {String} errorType type of the error, or empty if no error
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "error": "noError"
 *     }
 * @apiError noError if call was successful 
 * @apiError unknownError if error occurred during API call
 * @apiError supportNotFound if support was not found
 *
 */
routes.delete('/support', async (request, response) => {
    const responseData = {
        error: errors.unknownError,
    }

    try {
        const { addressFrom, addressTo} = request.body
        const requestData = {addressFrom, addressTo}

        // verify if support does not exists
        let documents = await Support.findOneAndRemove(requestData)

        if (!documents || documents.length <= 0) {
            responseData.error = errors.supportNotFound
        } else {
            responseData.error = errors.noError
        }
        response.json(responseData)

    } catch (e) {
        responseData.message = e.toString()
        response.json(responseData)
    }

});

module.exports = routes
