var config = require('../../../config')
var pkg = require('../../../package.json')

let { prefix } = config
prefix = !prefix
  ? ''
  : prefix === true
    ? `/${pkg.name}`
    : prefix === '/' ? '' : prefix

const port = ((config.middleware.assets || {}).config || {}).port || process.env.ASSETS_PORT || 8080
module.exports = {
    prefix,
    port
}
