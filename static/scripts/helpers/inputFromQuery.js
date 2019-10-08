/* eslint-disable no-console */
/* apply input from query */
import { getQueryParameters } from './queryStringParameter';

if (!NodeList.prototype.forEach) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}

window.addEventListener('DOMContentLoaded', () => {
	const params = getQueryParameters();
	Object.entries(params).forEach(([key, value]) => {
		try {
			document.querySelectorAll(`input[name="${key}"]`).forEach((input) => {
				input.value = value;
				input.setAttribute('readonly', 'true');
				const event = new CustomEvent('input', {
					bubbles: true,
					cancelable: true,
				});
				input.dispatchEvent(event);
			});
		} catch (error) {
			console.error(`Element: 'input[name="${key}"]' not found`);
		}
	});
});
