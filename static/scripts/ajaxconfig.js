
const csrftoken = document
	.querySelector('meta[name="csrfToken"]')
	.getAttribute('content');
window.csrftoken = csrftoken;
$.ajaxSetup({
	beforeSend(xhr) {
		xhr.setRequestHeader('Csrf-Token', csrftoken);
	},
});
