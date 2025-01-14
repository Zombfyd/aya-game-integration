const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Optional if using CSS stylesheets

module.exports = {
  entry: '.src/index.js',

  output: {
    filename: 'game-bundle.js',
    path: path.resolve(__dirname, 'docs'),
    publicPath: '/',
  },

  devtool: 'source-map',

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
          process.env.NODE_ENV === 'production'
            ? MiniCssExtractPlugin.loader
            : 'style-loader',
          'css-loader',
        ],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx'],
  },

  devServer: {
    contentBase: path.join(__dirname, 'docs'),
    compress: true,
    port: 9000,
    open: true,
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html'), // Fix the path here
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],

  optimization: {
    splitChunks: process.env.NODE_ENV === 'production' ? {
      chunks: 'all',
    } : false,
    minimize: process.env.NODE_ENV === 'production',
  },

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  stats: {
    children: true,
  },
};
