import getCookie from './cookieManager';

const USER_LANG_KEY = 'USER_LANG';

window.addEventListener('DOMContentLoaded', () => {
	const language = getCookie(USER_LANG_KEY);
	$('#language').val(language);

	$('#language').on('change', () => {
		const selectedLanguage = $('#language option:selected').val();
		if (selectedLanguage) {
			const currentURL = new URL(window.location.href);
			currentURL.searchParams.set('lng', selectedLanguage);
			document.cookie = `${USER_LANG_KEY}=${selectedLanguage}; path=/`;
			window.location.href = currentURL.toString();
			return false;
		}
		return true;
	});
});
