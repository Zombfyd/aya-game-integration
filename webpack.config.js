const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',

  output: {
    filename: 'game-bundle.js',
    path: path.resolve(__dirname, 'docs'),  // Keep this the same to output to 'docs' directory
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
    contentBase: path.join(__dirname, 'docs'),  // Serving content from the 'docs' directory
    compress: true,
    port: 9000,
    open: true,
  },

  plugins: [
    new HtmlWebpackPlugin({
      // Since your `index.html` is in the `docs` directory, we reference it like so
      template: path.resolve(__dirname, 'docs', 'index.html'),  // Specify correct path for HTML template
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    minimize: process.env.NODE_ENV === 'production',
  },

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  stats: {
    children: true,
  },
};
