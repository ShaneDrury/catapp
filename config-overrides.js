const rewireHtmlWebpackPlugin = require('react-app-rewire-html-webpack-plugin')

module.exports = function override(config, env) {
  const overrideConfig = { catsApiKey: process.env.CATS_API_KEY }
  config = rewireHtmlWebpackPlugin(config, env, overrideConfig)
  return config
}
