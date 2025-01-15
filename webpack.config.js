const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'game-bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',  // Ensure this is needed for your project setup
  },

  // Use source map only in production environment
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : false,

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx'],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'docs', 'index.html'),
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],

  optimization: {
    splitChunks: false, // No code splitting
    minimize: process.env.NODE_ENV === 'production', // Minify in production
  },

  mode: process.env.NODE_ENV || 'development',

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    client: {
      logging: 'none',  // Suppresses "Server started" messages
    },
    hot: false,  // Disable hot module replacement
    liveReload: false,  // Disable live reload
  },
};
