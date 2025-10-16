const fs = require('node:fs');
const path = require('node:path');

// Script for manually finding unused static files.
// It is assumed that you previously ran `npm run build` with SC_THEME=default (which is the default).

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

function getScriptFilePaths() {
	const dirPath = './static/scripts';
	const list = fs.readdirSync(dirPath, { recursive: true });
	const scriptFilePaths = list.filter((fileOrDir) => fileOrDir.endsWith('.js'));

	return scriptFilePaths;
}

function getHbsFilePaths() {
	const dirPath = '.';
	const list = fs.readdirSync(dirPath, { recursive: true });
	const hbsFilePaths = list.filter((fileOrDir) => fileOrDir.endsWith('.hbs'))
		.map((file) => path.join(dirPath, file));

	return hbsFilePaths;
}

function findUnusedStylesheets() {
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

			return fileContent.search(new RegExp(`@import.*${cssFileNameWithoutExt}`)) !== -1;
		});

		if (!isUsedinScss && !isUsedinHbs) {
			console.log('Unused stylesheet:', cssFilePath);
		}
	});
}

function findUnusedScripts() {
	const scriptFilePaths = getScriptFilePaths();
	const hbsFilePaths = getHbsFilePaths();

	scriptFilePaths.forEach((scriptFilePath) => {
		const isUsedinHbs = hbsFilePaths.some((hbsFileName) => {
			const fileContent = fs.readFileSync(hbsFileName, 'utf8');

			return fileContent.includes(scriptFilePath);
		});

		const isUsedInOtherScripts = scriptFilePaths.some((otherScriptFilePath) => {
			const fileContent = fs.readFileSync(path.join('./static/scripts', otherScriptFilePath), 'utf8');
			const scriptFileNameWithoutExt = path.basename(scriptFilePath, '.js');

			return fileContent.search(new RegExp(`import .*${scriptFileNameWithoutExt}`)) !== -1;
		});

		const isReferencedInGulpfile = fs.readFileSync('./gulpfile.js', 'utf8').includes(scriptFilePath);

		if (!isUsedinHbs && !isUsedInOtherScripts && !isReferencedInGulpfile) {
			console.log('Unused script:', scriptFilePath);
		}
	});
}

findUnusedStylesheets();
findUnusedScripts();
