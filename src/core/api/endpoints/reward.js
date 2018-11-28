const express = require('express')
const mongoose = require('mongoose')

const RewardModel = require('../../../models/reward')
const SupportModel = require('../../../models/support')

const errors = require('../errors')

const routes = express.Router()


routes.get('/reward/:address', async (request, response) => {
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

        // get all sing and sed addresses
        const supporting = await SupportModel.find({ addressFrom: address }, {_id:0, addressTo:1})
        const supported = await SupportModel.find({ addressTo: address }, {_id:0, addressFrom:1})

        // concat into one links array 
        const links = supporting.map(item=>item.addressTo)
            .concat(supported.map(item=>item.addressFrom))
        
        // get all rewards, where linkAddress = address (address for incoming reward)
        const reward = await RewardModel.find(
            {address: { $in: links },  linkAddress: address }, 
            {_id:0, address:1, linkAddress: 1, rewardTotal:1},{lean:true}
        )

        // now address - is a support, linkAddress is the target address
        // swap address and linkAddress so semantically it is right
        // and add supporting flag to resulting object, means address supports linkAddress 
        const rewardExtended = reward.map(item => {
            const foundSing = supporting.find(e => e.addressTo === item.address)
            const foundSed  = supported.find(e => e.addressFrom === item.address)

            return {
                address: item.linkAddress,
                linkAddress: item.address,
                rewardTotal: item.rewardTotal,
                supporting: typeof foundSing !== 'undefined',
                supported: typeof foundSed !== 'undefined'
            }
        }) 

        responseData.data = rewardExtended
        responseData.error = errors.noError
        response.json(responseData)
    } catch (e) {
        console.log(e)
        responseData.message = e.toString()
        response.json(responseData)
    }
})


module.exports = routes
