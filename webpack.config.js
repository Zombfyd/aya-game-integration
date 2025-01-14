const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');  // Optional if using CSS

module.exports = {
  entry: './src/index.js',

  output: {
    filename: 'game-bundle.js',  // Single bundled file
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
      template: './src/index.html',
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],

  optimization: {
    splitChunks: process.env.NODE_ENV === 'production' ? {
      chunks: 'all',
    } : false,  // Disable splitChunks in development to avoid conflicts
    minimize: process.env.NODE_ENV === 'production',
  },

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  stats: {
    children: true,
  },
};
