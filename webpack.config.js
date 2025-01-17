const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');  // Add dotenv-webpack plugin

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'game-bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',  // Ensure this is needed for your project setup
  },

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
    new Dotenv(),  // Add the dotenv plugin
  ],

  optimization: {
    splitChunks: false,
    minimize: process.env.NODE_ENV === 'production',
  },

  mode: process.env.NODE_ENV || 'production',

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    client: {
      logging: 'none',
      overlay: false,
    },
    hot: false,
    liveReload: false,
    allowedHosts: 'all',
    host: '0.0.0.0',
    port: 3000,
  },
};
