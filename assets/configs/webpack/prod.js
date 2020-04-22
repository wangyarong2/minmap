// production config
const merge = require('webpack-merge');
const path = require('path');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {prefix} = require('./const')
const commonConfig = require('./common')

module.exports = merge(commonConfig, {
  mode: 'production',
  entry: './index.tsx',
  output: {
    filename: 'js/bundle.[hash].min.js',
    path: path.resolve(__dirname, '../../.package'),
    publicPath: '/mind/assets/',
  },
  devtool: 'source-map',
  plugins: [
    // new HtmlWebpackPlugin({ template: '../../view/index.ejs', templateParameters: {
    //   isDebug: false,
    //   env: 'production',
    //   csrfToken: '',
    //   title: '',
    //   description: '',
    //   prefix
    // }}),
  ],
  optimization: {
    minimizer: [
      new TerserWebpackPlugin({
        cache: path.join(require('os').homedir(), '.honeypack_cache/terser-webpack-plugin'),
        test: /\.js(\?.*)?$/i,
        exclude: /\/node_modules/,
        parallel: true,
        sourceMap: false,
        terserOptions: {
          compress: {
            drop_console: true
          }
        }
      })
    ].filter(Boolean),
  }
});
