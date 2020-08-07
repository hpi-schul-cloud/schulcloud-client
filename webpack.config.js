const webpack = require('webpack');
const RebuildChangedPlugin = require('rebuild-changed-entrypoints-webpack-plugin');

let minimize = true;

const plugins = [
	// By default, moment loads aaaall the locale files, which bloats the bundle size
	// This plugin forces moment to only load the German locale
	new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /de/),
];

const devPlugins = [
	// Rebuild onlyl changed files
	new RebuildChangedPlugin({
		cacheDirectory: __dirname,
	}),
];

if (process.env.NODE_ENV !== 'production') {
	minimize = false;
	plugins.push(...devPlugins);
}

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
					presets: [['@babel/preset-env']],
					plugins: [
						'@babel/plugin-transform-react-jsx',
						'@babel/plugin-transform-runtime',
					],
				},
			},
			// moment needs to be globally exposed in order to work with fullcalendar
			{ test: require.resolve('moment'), loader: 'expose-loader?moment' },
		],
	},
	optimization: {
		minimize,
		splitChunks: {
			cacheGroups: {
				// Bundle react & react-dom into separate vendor-react bundle
				react: {
					test: /[\\/]node_modules[\\/](react-dom|react)[\\/]/,
					name: 'vendor-react',
					chunks: 'all',
				},
			},
		},
	},
	externals: {
		jquery: 'jQuery',
		'jquery-mousewheel': 'jQuery',
	},
	output: {
		path: '/',
		filename: '[name].js',
	},
	plugins,
};
