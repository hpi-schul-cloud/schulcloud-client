import './dataprivacy';

function validateDifferent() {
	const parentMailInput = document.querySelector('input[name="parent-email"]');
	const studentMailInput = document.querySelector('input[name="student-email"]');
	if (parentMailInput.value && studentMailInput.value && parentMailInput.value === studentMailInput.value) {
		parentMailInput
			.setCustomValidity('Für den Schüler muss eine andere Mailadresse als für die Eltern angegeben werden.');
		$(parentMailInput).closest('section').addClass('show-invalid');
	} else {
		parentMailInput.setCustomValidity('');
	}
}
function goBack(event) {
	event.stopPropagation();
	event.preventDefault();
	window.history.back();
}

window.addEventListener('DOMContentLoaded', () => {
	// show steppers depending on age of student
	const radiou16 = document.getElementById('reg-u16');
	const radio16 = document.getElementById('reg-16');


	/*
    // invalid registration detexted
    */
	const message = `<h4>Registrierung fehlerhaft</h4>
<p>Diese Registrierung bzw. dieser Registrierungslink scheint nicht valide zu sein. Dies kann mehrere Gründe haben:
    <ul>
        <li>Der Nutzer, dem dieser Registrierungslink gehört, hat sich bzw. wurde bereits registriert.</li>
        <li>
            Ein Lehrer oder Administrator hat für den entsprechenden Nutzer
            bereits die manuelle Einverständniserklärung durchgeführt.
        </li>
        <li>Der Registrierungslink ist sehr alt und nicht mehr korrekt mit dem entsprechenden Nutzer verknüpft.</li>
    </ul>
</p>
<p>Bitte kontaktiere einen verantwortlichen Lehrer oder Administrator und frage diesbezüglich nach.
Dieser kann weiterhelfen oder auch einen neuen Registrierungslink erstellen, falls nötig.</p>`;

	if ($("input[name='invalid']").val() === 'true') {
		$('#welcome-screen').empty().append(message);
		$('#welcome-screen').replaceWith(message);
		$('form').replaceWith(message);
	}

	if (document.querySelector('#showRegistrationForm')) {
		document.querySelector('#showRegistrationForm').addEventListener('click', () => {
			const baseUrl = '/registration';

			const classOrSchoolId = $('input[name=classOrSchoolId]').val();
			let additional = '';
			additional += $('input[name=sso]').val() === 'true' ? `sso/${$('input[name=account]').val()}` : '';
			additional += $('input[name=importHash]').val() !== undefined
				? `?importHash=${encodeURIComponent($('input[name=importHash]').val())}`
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
				document.getElementById('showRegistrationForm').disabled = false;
			} else {
				document.getElementById('infotext-16').style.display = 'none';
				document.getElementById('infotext-u16').style.display = 'block';
				document.getElementById('showRegistrationForm').disabled = false;
			}
		});
	}


	const parentMailInput = document.querySelector('input[name="parent-email"]');
	const studentMailInput = document.querySelector('input[name="student-email"]');
	if (parentMailInput && studentMailInput) {
		'change input keyup paste'.split(' ').forEach((event) => {
			parentMailInput.addEventListener(event, validateDifferent, false);
			studentMailInput.addEventListener(event, validateDifferent, false);
		});
	}

	const firstSection = document.querySelector('.form section[data-panel="section-1"]:not(.noback)');
	if (firstSection) {
		firstSection.addEventListener('showSection', () => {
			const backButton = document.getElementById('prevSection');
			backButton.addEventListener('click', goBack);
			backButton.removeAttribute('disabled');
		});
		firstSection.addEventListener('hideSection', () => {
			const backButton = document.getElementById('prevSection');
			backButton.removeEventListener('click', goBack);
		});
	}
});


// GENERATE START PASSWORD
window.addEventListener('load', () => {
	if (document.querySelector('.form .student-password')) {
		// generate password if password field present
		const words = ['auto', 'baum', 'bein', 'blumen', 'flocke', 'frosch', 'halsband',
			'hand', 'haus', 'herr', 'horn', 'kind', 'kleid', 'kobra', 'komet', 'konzert',
			'kopf', 'kugel', 'puppe', 'rauch', 'raupe', 'schuh', 'seele', 'spatz',
			'taktisch', 'traum', 'trommel', 'wolke'];
		const pw = words[Math.floor((Math.random() * words.length))] + Math.floor((Math.random() * 98) + 1).toString();
		$('.form .student-password').text(pw);
		$('.form .student-password-input').val(pw).trigger('input');
	}
});
