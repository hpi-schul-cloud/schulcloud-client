const webpack = require('webpack');
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

if (process.env.NODE_ENV !== 'production') {
	minimize = false;
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
				options: {
					presets: [['@babel/preset-env']],
					plugins: [
						'@babel/plugin-transform-react-jsx',
						'@babel/plugin-transform-runtime',
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
		],
	},
	optimization: {
		minimize,
		splitChunks: {
			cacheGroups: {
				// Bundle react & react-dom into separate vendor-react bundle
				react: {
					test: /[\\/]node_modules[\\/](react-dom|react)[\\/]/,
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
