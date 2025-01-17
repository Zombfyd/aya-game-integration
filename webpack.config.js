const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'game-bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/', // Keep this if you're serving static files from root
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
        use: [MiniCssExtractPlugin.loader, 'css-loader'], // Using MiniCssExtractPlugin.loader for production
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

  mode: process.env.NODE_ENV || 'production',

  // Only use `devServer` in local development.
  devServer: process.env.NODE_ENV === 'development' ? {
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
  } : {},
};
