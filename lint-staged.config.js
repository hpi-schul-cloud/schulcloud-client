module.exports = {
	'static/images/**/*.{png,jpeg,jpg,gif,svg}': [
		'imagemin-lint-staged',
		'git add',
	],
};
