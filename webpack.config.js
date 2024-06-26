const webpack = require('webpack');
const RebuildChangedPlugin = require('rebuild-changed-entrypoints-webpack-plugin');
const CKEditorWebpackPlugin = require('@ckeditor/ckeditor5-dev-webpack-plugin');
const { styles } = require('@ckeditor/ckeditor5-dev-utils');

let minimize = true;

const plugins = [
	// By default, moment loads aaaall the locale files, which bloats the bundle size
	// This plugin forces moment to only load the German locale
	new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /de/),

	new CKEditorWebpackPlugin({
		language: 'de',
		addMainLanguageTranslationsToAllAssets: true,
	}),
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
			// All files that end on .js or .jsx are transpilled by babel.
			// Also the htmlparser2 module (as dependency of sanitize-html)
			// needs to be included in transpilling, because of the module
			// being otherwise not compatible with webpack 4.x (see
			// https://github.com/apostrophecms/sanitize-html/issues/592 ).
			// In addition the @babel/plugin-proposal-export-namespace-from
			// was also added for that reason as well and can be removed
			// once the update to webpack 5.x is done.
			{
				test: /\.(js|jsx)$/,
				exclude: /(node_modules)[/\\](?!(htmlparser2)[/\\])/,
				loader: 'babel-loader',
				query: {
					presets: [['@babel/preset-env']],
					plugins: [
						'@babel/plugin-transform-react-jsx',
						'@babel/plugin-transform-runtime',
						'@babel/plugin-proposal-export-namespace-from',
					],
				},
			},
			{
				test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
				use: ['raw-loader'],
			},
			{
				test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,
				use: [
					{
						loader: 'style-loader',
						options: {
							injectType: 'singletonStyleTag',
							attributes: {
								'data-cke': true,
							},
						},
					},
					{
						loader: 'postcss-loader',
						options: styles.getPostCssConfig({
							themeImporter: {
								themePath: require.resolve('@ckeditor/ckeditor5-theme-lark'),
							},
							minify: true,
						}),
					},
				],
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
