import './registration-link-validation';

window.addEventListener('DOMContentLoaded', () => {
	// show steppers depending on age of student
	const radiou16 = document.getElementById('reg-u16');
	const radio16 = document.getElementById('reg-16');

	if (document.querySelector('#showRegistrationForm')) {
		document
			.querySelector('#showRegistrationForm')
			.addEventListener('click', () => {
				const baseUrl = '/registration';

				const classOrSchoolId = $('input[name=classOrSchoolId]').val();
				let additional = '';
				additional
					+= $('input[name=sso]').val() === 'true'
						? `sso/${$('input[name=account]').val()}`
						: '';
				additional
					+= $('input[name=importHash]').val() !== undefined
						? `?importHash=${encodeURIComponent(
							$('input[name=importHash]').val(),
						)}`
						: '';

				if (radiou16.checked) {
					window.location.href = `${baseUrl}/${classOrSchoolId}/byparent/${additional}`;
				} else {
					window.location.href = `${baseUrl}/${classOrSchoolId}/bystudent/${additional}`;
				}
			});
		$("input[type='radio']").on('change', () => {
			if (radio16.checked) {
				document.getElementById('infotext-16').style.display = 'block';
				document.getElementById('infotext-u16').style.display = 'none';
				document.getElementById(
					'showRegistrationForm',
				).disabled = false;
			} else {
				document.getElementById('infotext-16').style.display = 'none';
				document.getElementById('infotext-u16').style.display = 'block';
				document.getElementById(
					'showRegistrationForm',
				).disabled = false;
			}
		});
	}
});
