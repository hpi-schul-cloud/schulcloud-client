const path = require('node:path');
const webpack = require('webpack');

// Use WEBPACK_PRODUCTION=1 to build in production mode (minified, no source maps).
// NODE_ENV is intentionally not used here because setting it to 'production' also
// triggers app config validation (ETHERPAD_PAD_URI etc.) which is unavailable at build time.
const isDev = !process.env.WEBPACK_PRODUCTION;
const minimize = !isDev;

const plugins = [
	// By default, moment loads aaaall the locale files, which bloats the bundle size
	// This plugin forces moment to only load the German locale
	new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /de/),
];

const isEditorCss = (filePath) => filePath.endsWith('.css') && filePath.includes('@hpi-schul-cloud/ckeditor');

module.exports = {
	mode: isDev ? 'development' : 'production',
	cache: isDev ? { type: 'filesystem' } : false,
	module: {
		rules: [
			// Application source + htmlparser2 need transpilation.
			// Everything else in node_modules is already compiled.
			{
				test: /\.(?:js|jsx|cjs)$/,
				include: [
					path.resolve(__dirname, 'static/scripts'),
					path.resolve(__dirname, 'static/vendor'),
					/htmlparser2/,
				],
				loader: 'babel-loader',
				options: {
					sourceType: 'unambiguous',
					presets: [['@babel/preset-env', { modules: false }]],
					plugins: [
						'@babel/plugin-transform-react-jsx',
						'@babel/plugin-transform-runtime',
					],
				},
			},
			// Styles from the shared CKEditor package (handles both npm installs and local file: symlinks).
			{
				test: isEditorCss,
				use: ['style-loader', 'css-loader'],
			},
			// moment needs to be globally exposed in order to work with fullcalendar
			{
				test: require.resolve('moment'),
				loader: 'expose-loader',
				options: { exposes: [{ globalName: 'moment', override: true }] },
			},
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
