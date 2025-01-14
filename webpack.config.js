const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // if using CSS stylesheets (optional)

module.exports = {
  // Entry point: Where Webpack starts bundling
  entry: './src/index.js',

  // Output settings
  output: {
    filename: './docs/game-bundle.js',   // The bundled file
    path: path.resolve(__dirname, 'dist'),  // Output directory (dist)
    publicPath: '/' // For correctly loading assets if hosted at root
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
            presets: ['@babel/preset-env', '@babel/preset-react'] // Add presets for React
          }
        }
      },
      {
        test: /\.css$/,  // Optional rule for handling CSS (if using stylesheets)
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx']  // Resolve .jsx and .js file extensions
  },

  // Configuration for development server (optional, for local dev)
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'), // Directory where HTML and bundles are served from
    compress: true,  // Enable gzip compression
    port: 9000,      // Port number
    hot: true        // Enable Hot Module Replacement (HMR)
  },

  // Webpack plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',   // Use this template for generating the index.html
      filename: 'index.html'          // Output the HTML in the dist directory
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',         // Extract CSS into a separate file (if CSS is used)
    })
  ],

  mode: 'development'  // Set mode to 'production' for actual production builds
};
