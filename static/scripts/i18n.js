import i18next from 'i18next';
import Fetch from 'i18next-fetch-backend';

const userLanguage = document.querySelector('html').getAttribute('lang');

const resources = {};
if (window.i18nLocaleData) {
	resources[userLanguage] = { translation: window.i18nLocaleData };
}

i18next
	.use(Fetch)
	.init({
		initImmediate: false,
		lng: userLanguage,
		fallbackLng: ['de', 'en'].filter((lng) => lng !== userLanguage),
		resources,
		backend: {
			loadPath: (lng) => `/locales/${lng}.json`,
		},
	})
	.then(() => {
		window.$t = (...args) => i18next.t(...args);
	});
