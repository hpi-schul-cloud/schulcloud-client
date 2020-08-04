import i18next from 'i18next';
import Backend from 'i18next-chained-backend';
import LocalStorageBackend from 'i18next-localstorage-backend'; // primary use cache
import Fetch from 'i18next-fetch-backend'; // fallback xhr load
import pkg from '../../package.json';

const userLanguage = document.querySelector('html').getAttribute('lang');

// mock method. used until language keys are loaded. (not perfect, but at least it works for now)
window.$t = (key) => key;

i18next
	.use(Backend)
	.init({
		initImmediate: false,
		lng: userLanguage,
		fallbackLng: ['de', 'en'].filter((lng) => lng !== userLanguage),
		backend: {
			backends: [
				LocalStorageBackend, // primary
				Fetch, // fallback
			],
			backendOptions: [
				{
					prefix: 'i18next_res_',
					defaultVersion: `v${pkg.version}`, // forces a language file reload on version change
				},
				{
					loadPath: '/locales/{{lng}}.json',
				},
			],
		},
	})
	.then(() => {
		window.$t = (...args) => i18next.t(...args);
	});
