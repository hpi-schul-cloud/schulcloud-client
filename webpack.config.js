const webpack = require("webpack");
const RebuildChangedPlugin = require("rebuild-changed-entrypoints-webpack-plugin");

module.exports = {
  mode: "production",
  module: {
    rules: [
      // Make webpack load css files
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      // All files that end on .js or .jsx are transpilled by babel
      {
        test: /\.(js|jsx)$/,
        resolve: { extensions: [".js", ".jsx"] },
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["@babel/plugin-proposal-class-properties"]
          }
        }
      },
      // moment needs to be globally exposed in order to work with fullcalendar
      { test: require.resolve("moment"), loader: "expose-loader?moment" }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        // Bundle react, react-dom and @material-ui into separate vendor-react bundle
        react: {
          test: /[\\/]node_modules[\\/](react-dom|react|@material-ui)[\\/]/,
          name: "vendor-react",
          chunks: "all"
        }
      }
    }
  },
  externals: {
    jquery: "jQuery",
    "jquery-mousewheel": "jQuery"
  },
  output: {
    path: "/",
    filename: "[name].js"
  },
  performance: {
    hints: process.env.NODE_ENV === "production" ? "warning" : false,
    maxEntrypointSize: 500000,
    maxAssetSize: 400000
  },
  plugins: [
    new RebuildChangedPlugin({
      cacheDirectory: __dirname
    }),
    // By default, moment loads aaaall the locale files, which bloats the bundle size
    // This plugin forces moment to only load the German locale
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /de/)
  ]
};
