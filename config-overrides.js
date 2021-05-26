const rewireHtmlWebpackPlugin = require('react-app-rewire-html-webpack-plugin')
const rewireStyledComponents = require("react-app-rewire-styled-components");

module.exports = function override(config, env) {
  const overrideConfig = { catsApiKey: process.env.CATS_API_KEY }
  config = rewireHtmlWebpackPlugin(config, env, overrideConfig)
  config = rewireStyledComponents(config, env);
  return config
}
