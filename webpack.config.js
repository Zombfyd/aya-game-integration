const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'game-bundle.js',
    // Change output path for Render
    path: path.resolve(__dirname, 'dist'),
    // Update publicPath for Render
    publicPath: '/',
  },
  
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',

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
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx'],
  },

  // Update devServer configuration for Render
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: process.env.PORT || 9000,
    historyApiFallback: true,
    hot: true,
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],

  optimization: {
    splitChunks: false,
    minimize: process.env.NODE_ENV === 'production',
  },

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
}
