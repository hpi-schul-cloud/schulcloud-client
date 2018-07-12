const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
    mode: 'production',
    module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader',
            query: {
                presets: [["es2015"]],
                plugins: ["transform-react-jsx"]
            },
          },
          {
            test: /\.vue$/,
            loader: 'vue-loader',
          },
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
                vue: {
                  test: /[\\/]node_modules[\\/](vue)[\\/]/,
                  name: 'vendor-vue',
                  chunks: 'all',
                },
            }
        }
    },
    externals: {
        "jquery": "jQuery",
        "jquery-mousewheel": "jQuery-mousewheel",
    },
    output: {
        path: '/',
        filename: '[name].js'
    },
    plugins: [ new VueLoaderPlugin() ]
};
