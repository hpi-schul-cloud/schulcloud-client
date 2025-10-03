const fs = require('fs');
const path = require('path');

// Script for manually finding unused scripts

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
