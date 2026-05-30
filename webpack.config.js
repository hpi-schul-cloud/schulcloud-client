const path = require('path');
const webpack = require('webpack');
const CKEditorWebpackPlugin = require('@ckeditor/ckeditor5-dev-webpack-plugin');
const { styles } = require('@ckeditor/ckeditor5-dev-utils');

// Force all CKEditor5 internal packages to resolve to a single canonical copy.
// In v41, individual packages depend on the `ckeditor5` meta-package which
// installs its own nested copies, causing the ckeditor-duplicated-modules error.
const CK_PACKAGES = ['ckeditor5-clipboard', 'ckeditor5-engine', 'ckeditor5-enter',
	'ckeditor5-typing', 'ckeditor5-undo', 'ckeditor5-utils', 'ckeditor5-widget'];
const ckAlias = Object.fromEntries(
	CK_PACKAGES.map(pkg => [
		`@ckeditor/${pkg}`,
		path.resolve(__dirname, `node_modules/ckeditor5/node_modules/@ckeditor/${pkg}`),
	]),
);

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

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
	mode: isDev ? 'development' : 'production',
	cache: isDev ? { type: 'filesystem' } : false,
	module: {
		rules: [
			// All files that end on .js or .jsx are transpiled by babel.
			// htmlparser2 and @isaul32 are excluded from the node_modules
			// exclusion because they use syntax that requires transpilation.
			{
				test: /\.(?:js|jsx|cjs)$/,
				exclude: /(node_modules)[/\\](?!(htmlparser2|@isaul32)[/\\])/,
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
			{
				test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
				type: 'asset/source',
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
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: styles.getPostCssConfig({
								themeImporter: {
									themePath: require.resolve('@ckeditor/ckeditor5-theme-lark'),
								},
								minify: true,
							}),
						},
					},
				],
			},
			// moment needs to be globally exposed in order to work with fullcalendar
			{
				test: require.resolve('moment'),
				loader: 'expose-loader',
				options: { exposes: ['moment'] },
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
	resolve: {
		alias: ckAlias,
	},
	output: {
		path: '/',
		filename: '[name].js',
	},
	plugins,
};
