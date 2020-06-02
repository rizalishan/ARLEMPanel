const base = require('./webpack.base.config')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const mainConfig = require('../config/default.json')

const config = Object.assign({}, base, {
  plugins: base.plugins || []
})

config.plugins.push(
  new ExtractTextPlugin(mainConfig.baseUrl.replace('/', '') + 'assets/styles.css')
)

module.exports = config
