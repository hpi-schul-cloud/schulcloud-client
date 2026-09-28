import i18next from 'i18next';

const userLanguage = document.querySelector('html').getAttribute('lang');

window.$t = (...args) => i18next.t(...args);

const resources = {};
if (window.i18nLocaleData) {
	resources[userLanguage] = { translation: window.i18nLocaleData };
}

i18next.init({
	initImmediate: false,
	lng: userLanguage,
	fallbackLng: false,
	resources,
});
