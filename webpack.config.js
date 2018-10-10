const webpack = require("webpack");
const RebuildChangedPlugin = require("rebuild-changed-entrypoints-webpack-plugin");

module.exports = {
  mode: "development",
  module: {
    rules: [
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
        // Bundle react & react-dom into separate vendor-react bundle
        react: {
          test: /[\\/]node_modules[\\/](react-dom|react)[\\/]/,
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
  plugins: [
    new RebuildChangedPlugin({
      cacheDirectory: __dirname
    }),
    // By default, moment loads aaaall the locale files, which bloats the bundle size
    // This plugin forces moment to only load the German locale
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /de/)
  ]
};
