const {Service} = require('./serviceMemory')

const service = new Service();
service.generateNewAddress();

module.exports = service;