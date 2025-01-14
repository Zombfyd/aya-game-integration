const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // if using CSS stylesheets (optional)

module.exports = {
  // Entry point: Where Webpack starts bundling
  entry: './src/index.js',

  // Output settings
  output: {
    filename: 'game-bundle.js',  // Output bundled file
    path: path.resolve(__dirname, 'docs'),  // Ensure it's saved in the `docs` directory
    publicPath: '/',  // Ensures assets are served from the root level
  },

  // Enable source maps for development
  devtool: 'source-map',  // 'eval-source-map' is usually better for faster builds in development

  // Setup module rules
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,  // Process both JS and JSX files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],  // Add presets for React JSX
            // If needed, include other Babel configuration options (plugins or settings)
          },
        },
      },
      {
        test: /\.css$/,  // Optional rule for handling CSS (if using stylesheets)
        use: [
          process.env.NODE_ENV === 'production' ? MiniCssExtractPlugin.loader : 'style-loader', // Use style-loader for development
          'css-loader',
        ],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx'],  // Resolve .jsx and .js file extensions
  },

  // Configuration for development server (optional, for local dev)
  devServer: {
    contentBase: path.join(__dirname, 'docs'),  // Directory to serve static files
    compress: true,   // Enable gzip compression
    port: 9000,  // Adjust the port number if necessary
    historyApiFallback: true,  // Fallback to index.html for Single Page Apps (SPA)
  },

  // Webpack plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',  // Use this template for generating the index.html
      filename: 'index.html',       // Output the HTML in the dist directory
      inject: 'body',               // Inject scripts at the end of the body to ensure everything is loaded
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',  // Extract CSS into a separate file in production mode
    }),
  ],

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',  // Dynamically switch between dev and prod mode based on environment variable
};
