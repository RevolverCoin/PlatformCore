const Service = require('./serviceDatabase')

const service = new Service();
service.generateNewAddress();

module.exports = service;