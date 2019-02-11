'use strict'

const OPERATIONS = [
  'putItem',
  'getItem',
  'updateItem',
  'deleteItem',
  'createTable',
  'deleteTable',
  'query',
  'scan'
]

let dynamoProtoWrapped = false

function instrument(shim, AWS) {
  shim.wrapReturn(AWS, 'DynamoDB', function wrapDynamo(shim, fn, name, ddb) {
    if (dynamoProtoWrapped) {
      return
    }
    dynamoProtoWrapped = true

    shim.setDatastore('DynamoDB')

    shim.recordOperation(
      ddb,
      OPERATIONS,
      function wrapMethod(shim, original, name, args) {
        return {
          parameters: {
            name,
            host: this.endpoint.host,
            port_path_or_id: this.endpoint.port,
            database_name: args[0].TableName || 'Unknown'
          },
          callback: shim.LAST,
          opaque: true
        }
      }
    )
  })
}

module.exports = {
  name: 'dynamodb',
  type: 'datastore',
  instrument,
  validate: (shim, AWS) => {
    if (!shim.isFunction(AWS.DynamoDB)) {
      shim.logger.debug('Could not find DynamoDB, not instrumenting.')
      return false
    }
    return true
  }
}