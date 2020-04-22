// shared config (dev and prod)
const { resolve } = require('path')
const { CheckerPlugin } = require('awesome-typescript-loader')
const postcssPresetEnv = require('postcss-preset-env')
const AssetListWebpackPlugin = require('webpack-plugin-named-chunks-list');
const {prefix} = require('./const')

let isProduction = process.env.NODE_ENV === 'production';
console.log('isProduction', isProduction);

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: require('path').join(
      require('os').homedir(),
      '.honeypack_cache/babel-loader'
    ),
  }
}

module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  context: resolve(__dirname, '../../src'),
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [babelLoader, 'source-map-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.tsx?$/,
        use: [
          babelLoader,
          {
            loader: 'awesome-typescript-loader',
            options: {
              useCache: true
            }
          },
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [postcssPresetEnv({stage: 0})]
            }
          }
        ]
      },
      {
        test: /\.less$/,
        loaders: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'less-loader'
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file-loader?hash=sha512&digest=hex&name=img/[hash].[ext]',
          'image-webpack-loader?bypassOnDebug&optipng.optimizationLevel=7&gifsicle.interlaced=false'
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,

        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]',
            outputPath: 'fonts/',
            publicPath: (url, resourcePath, context) => {
              return `${prefix}/assets/fonts/${url}`
            }
          }
        }
      },
    ]
  },
  plugins: [
    new CheckerPlugin(),
    new AssetListWebpackPlugin(),
  ],
  externals: {
    // react: 'React',
    // 'react-dom': 'ReactDOM',
    // lodash: '_'
  },
  performance: {
    hints: false
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: module =>
            /[\\/]node_modules[\\/]/.test(module.resource) &&
            module.constructor.name !== 'CssModule',
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  }
}
