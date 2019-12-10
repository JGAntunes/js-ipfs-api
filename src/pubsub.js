'use strict'

const promisify = require('promisify-es6')
const isNode = require('detect-node')
const setImmediate = require('async/setImmediate')
const stringlistToArray = require('./utils/stringlist-to-array')
const moduleConfig = require('./utils/module-config')

const NotSupportedError = () => new Error('pubsub is currently not supported when run in the browser')

/* Public API */
module.exports = (arg) => {
  const send = moduleConfig(arg)

  return {
    subscribe: promisify((topic, options, callback) => {
      const defaultOptions = {
        discover: true
      }

      if (typeof options === 'function') {
        callback = options
        options = defaultOptions
      }

      if (!options) {
        options = defaultOptions
      }

      // Throw an error if ran in the browsers
      if (!isNode) {
        if (!callback) {
          return Promise.reject(NotSupportedError())
        }

        return setImmediate(() => callback(NotSupportedError()))
      }

      const request = {
        path: 'pubsub/sub',
        args: [topic],
        qs: {
          discover: options.discover
        }
      }

      send(request, callback)
    }),
    // No op for now
    unsubscribe: promisify((topic, callback) => {
      return setImmediate(() => callback())
    }),
    publish: promisify((topic, data, callback) => {
      if (!isNode) {
        return callback(NotSupportedError())
      }

      if (!Buffer.isBuffer(data)) {
        return callback(new Error('data must be a Buffer'))
      }

      const request = {
        path: 'pubsub/pub',
        args: [topic, data]
      }

      send(request, callback)
    }),
    ls: promisify((callback) => {
      if (!isNode) {
        return callback(NotSupportedError())
      }

      const request = {
        path: 'pubsub/ls'
      }

      send.andTransform(request, stringlistToArray, callback)
    }),
    peers: promisify((topic, callback) => {
      if (!isNode) {
        return callback(NotSupportedError())
      }

      const request = {
        path: 'pubsub/peers',
        args: [topic]
      }

      send.andTransform(request, stringlistToArray, callback)
    })
  }
}
