const Service = require('./serviceDatabase')

const service = new Service();
service.init();

module.exports = service;