const express = require('express')
const mongoose = require('mongoose')

const SupportModel = require('../../../models/support')
const AddressModel = require('../../../models/address')

const blockchainService = require('../../blockchain/service')

const errors = require('../errors')

const routes = express.Router()

/**
 * @api {get} /service/info GetServiceInfo
 * @apiName GetServiceInfo
 * @apiGroup Service
 *
 *
 * @apiSuccess {Boolean} success Success flag
 * @apiSuccess {String} errorType type of the error, or empty if no error
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "error": "noError",
 *       "data": {
 *          "blockHeight": 126,
 *          "lastBlockTime": "timestamp",
 *          "addresses": 3456,
 *          "supports": 2000,
 *          "sing": 1234,
 *          "sed": 345,
 *          "generators": 1     
 *       }
 *     }
 * @apiError noError if call was successful 
 * @apiError unknownError if error occurred during API call
 *
 */
routes.get('/service/info', async (request, response) => {
    const responseData = {
        error: errors.unknownError,
    }
    try {
        const height    = await blockchainService.getHeight()
        const info      = await blockchainService.getBlockInfo(height-1)

        const addressCount = await AddressModel.estimatedDocumentCount()
        const supportCount = await SupportModel.estimatedDocumentCount()

        const singUnique  = await SupportModel.distinct('addressFrom')
        const sedUnique  = await SupportModel.distinct('addressTo')

        const generatorCount = await AddressModel.countDocuments({type:'Generator'})

        responseData.data = {
            blockHeight: info.height,
            lastBlockTime: info.time,
            addresses: addressCount,
            supports: supportCount,
            sing: singUnique.length,
            sed: sedUnique.length,
            generators: generatorCount
        }
        responseData.error = errors.noError
        response.json(responseData)
    } catch (e) {
        console.log(e)
        responseData.message = e.toString()
        response.json(responseData)
    }
})


module.exports = routes
