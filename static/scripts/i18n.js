import i18next from 'i18next';
import Fetch from 'i18next-fetch-backend';

const userLanguage = document.querySelector('html').getAttribute('lang');
const localeVersionsElement = document.getElementById('locale-versions');
const localeVersions = localeVersionsElement ? JSON.parse(localeVersionsElement.textContent) : {};

// mock method. used until language keys are loaded. (not perfect, but at least it works for now)
window.$t = (key) => key;

i18next
	.use(Fetch)
	.init({
		initImmediate: false,
		lng: userLanguage,
		fallbackLng: ['de', 'en'].filter((lng) => lng !== userLanguage),
		backend: {
			loadPath: (lng) => localeVersions[lng] || `/locales/${lng}.json`,
		},
	})
	.then(() => {
		window.$t = (...args) => i18next.t(...args);
	});
