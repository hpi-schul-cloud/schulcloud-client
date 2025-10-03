const fs = require('fs');
const path = require('path');

// Script for manually finding unused stylesheets

function getCssFilePaths() {
	const dirPath = './build/default/styles';
	const list = fs.readdirSync(dirPath, { recursive: true });
	const cssFilePaths = list.filter((fileOrDir) => fileOrDir.endsWith('.css'));

	return cssFilePaths;
}

function getScssFilePaths() {
	const dirPath = './static/styles';
	const list = fs.readdirSync(dirPath, { recursive: true });
	const scssFilePaths = list.filter((fileOrDir) => fileOrDir.endsWith('.scss'))
		.map((file) => path.join(dirPath, file));

	return scssFilePaths;
}

function getHbsFilePaths() {
	const dirPath = '.';
	const list = fs.readdirSync(dirPath, { recursive: true });
	const hbsFilePaths = list.filter((fileOrDir) => fileOrDir.endsWith('.hbs'))
		.map((file) => path.join(dirPath, file));

	return hbsFilePaths;
}

const cssFilePaths = getCssFilePaths();
const scssFilePaths = getScssFilePaths();
const hbsFilePaths = getHbsFilePaths();

cssFilePaths.forEach((cssFilePath) => {
	const isUsedinHbs = hbsFilePaths.some((hbsFileName) => {
		const fileContent = fs.readFileSync(hbsFileName, 'utf8');

		return fileContent.includes(cssFilePath);
	});

	const isUsedinScss = scssFilePaths.some((scssFileName) => {
		const fileContent = fs.readFileSync(scssFileName, 'utf8');
		const cssFileNameWithoutExt = path.basename(cssFilePath, '.css');

		return fileContent.includes(`./${cssFileNameWithoutExt}`);
	});

	if (!isUsedinScss && !isUsedinHbs) {
		console.log('Unused CSS file:', cssFilePath);
	}
});
