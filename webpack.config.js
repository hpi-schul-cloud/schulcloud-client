const webpack = require("webpack");
const RebuildChangedPlugin = require('rebuild-changed-entrypoints-webpack-plugin');

module.exports = {
    mode: 'production',
    module: {
        rules: [
            // All files that end on .js or .jsx are transpilled by babel
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: [["es2015"]],
                    plugins: ["transform-react-jsx"]
                },
            },
            // moment needs to be globally exposed in order to work with fullcalendar
            { test: require.resolve('moment'), loader: 'expose-loader?moment' }
        ]
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                // Bundle react & react-dom into separate vendor-react bundle
                react: {
                  test: /[\\/]node_modules[\\/](react\-dom|react)[\\/]/,
                  name: 'vendor-react',
                  chunks: 'all',
                },
            }
        },
    },
    externals: {
        "jquery": "jQuery",
        "jquery-mousewheel": "jQuery",
    },
    output: {
        path: '/',
        filename: '[name].js'
    },
    plugins: [
        new RebuildChangedPlugin({
            cacheDirectory: __dirname,
        }),
        // By default, moment loads aaaall the locale files, which bloats the bundle size
        // This plugin forces moment to only load the German locale
        new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /de/),
    ]
};