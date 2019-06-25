
$(document).ready(() => {
	var csrftoken = document
		.querySelector('meta[name="csrfToken"]')
		.getAttribute('content');
	window.csrftoken = csrftoken;
	$.ajaxSetup({
		beforeSend: function(xhr) {
			xhr.setRequestHeader('Csrf-Token', csrftoken);
		}
	});
});
