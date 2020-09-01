import './registration-link-validation';
import getCookie from '../helpers/cookieManager';

const USER_LANG_KEY = 'USER_LANG';
const USER_LANG_SET_KEY = 'USER_LANG_SET';

window.addEventListener('DOMContentLoaded', () => {
	// show language settings if not set
	if (getCookie(USER_LANG_SET_KEY) === 'true') {
		document.querySelector('#language-screen').style.display = 'none';
		document.querySelector('#welcome-screen').style.display = 'block';
	} else {
		document.querySelector('#language-screen').style.display = 'block';
		document.querySelector('#welcome-screen').style.display = 'none';
		const langFromCookie = getCookie(USER_LANG_KEY);
		$('#defaultLanguage').val(langFromCookie);
		$('select').trigger('chosen:updated');
	}

	if (document.querySelector('#showAgeSelection')) {
		document
			.querySelector('#showAgeSelection')
			.addEventListener('click', () => {
				const selectedLanguage = $('#defaultLanguage').val();
			//  deepcode ignore OverwriteAssignment: this is the syntax for the new cookie
				document.cookie = `${USER_LANG_KEY}=${selectedLanguage}; path=/`;
				document.cookie = `${USER_LANG_SET_KEY}=true; path=/`;
				window.location.reload();
			});
	}

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

		$('#prevSection').on('click', () => {
			document.cookie = `${USER_LANG_SET_KEY}=false; path=/`;
			window.location.reload();
		});
	}
});
