const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Optional: Only needed if you are using CSS stylesheets

module.exports = {
  // Entry point: Where Webpack starts bundling
  entry: './src/index.js',

  // Output settings
  output: {
    filename: 'game-bundle.js',   // Output bundled file
    path: path.resolve(__dirname, 'docs'),  // Ensure it's saved in the `docs` directory
    publicPath: '/',  // Serves assets correctly at root level
  },

  // Enable source maps for development
  devtool: 'source-map',   // 'eval-source-map' for faster rebuilds in development

  // Setup module rules
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,  // Process both JS and JSX files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'], // Ensure JSX is correctly processed
          },
        },
      },
      {
        test: /\.css$/,  // Optional rule for handling CSS (if using stylesheets)
        use: [
          process.env.NODE_ENV === 'production' 
            ? MiniCssExtractPlugin.loader 
            : 'style-loader', // Use style-loader in development mode for hot reloading
          'css-loader',
        ],
      },
    ],
  },

  // Enable React JSX and ES6+ feature transpiling
  resolve: {
    extensions: ['.js', '.jsx'],  // Resolve .jsx and .js file extensions
  },

  // Configuration for development server (optional, for local dev)
  devServer: {
    contentBase: path.join(__dirname, 'docs'),
    compress: true,
    port: 9000,  // Adjust the port number if necessary
    open: true,   // Open browser automatically
  },

  // Webpack plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',   // Use this template for generating the index.html
      filename: 'index.html',         // Output the HTML in the docs directory
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',         // Extract CSS into a separate file (if CSS is used)
    }),
  ],

  optimization: {
    // Split bundles between core and dependencies
    splitChunks: {
      chunks: 'all',  // All types of chunk requests will be considered
    },
    // Disable minification during development to simplify debugging
    minimize: process.env.NODE_ENV === 'production',
  },

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',  // Set mode based on the environment
  stats: {
    children: true,  // Enable child compilation logging for easier debugging
  },
};
