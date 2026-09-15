// Must match the languages bundled by @hpi-schul-cloud/ckeditor.
const SUPPORTED_LANGUAGES = new Set(['de', 'en', 'es', 'uk']);

const getEditorLanguage = () => {
	const { lang } = document.documentElement;
	return SUPPORTED_LANGUAGES.has(lang) ? lang : 'de';
};

const ckeditorConfig = {
	language: getEditorLanguage(),
	filebrowser: {
		browseUrl: '/files/my',
	},
};

export default ckeditorConfig;
