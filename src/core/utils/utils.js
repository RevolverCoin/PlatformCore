/**
 * Defines template for successful responses
 * @param {*} data
 */
function createSuccessResponse(data) {
  return {
    success: true,
    data
  }
}


function createErrorResponse(error) {
  return {
    success: false,
    errors:[error]
  }
}

/**
 * removes undefined properties from object
 * @param obj
 */
function cleanObject(obj) {
  const result = Object.assign(obj)
  for (const propName in result) {
      if (result[propName] === null || result[propName] === undefined) {
          delete result[propName];
      }
  }

  return result
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  cleanObject
}
