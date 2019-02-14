import '../../helpers/inputLinking';

function toggleFieldClass(clicked, fieldClass) {

	// Change lock status
	let lockStatus = true;
	if (clicked.classList.contains('fa-lock')) {
		clicked.classList.remove('fa-lock');
		clicked.classList.add('fa-unlock');
	} else {
		lockStatus = false;
		clicked.classList.remove('fa-unlock');
		clicked.classList.add('fa-lock');
	}

	// Activate/Disable form elements
	const elements = document.querySelectorAll(fieldClass);
	elements.forEach((element) => {
		if (lockStatus) {
			element.disabled = false;
		} else {
			element.disabled = true;
		}
	});
}

window.addEventListener('DOMContentLoaded', () => {
	document.querySelector('#user-section-toggle').addEventListener('click', (clicked) => { toggleFieldClass(clicked.target, '.user-attribute'); });
	document.querySelector('#role-section-toggle').addEventListener('click', (clicked) => { toggleFieldClass(clicked.target, '.role-attribute'); });
	document.querySelector('#class-section-toggle').addEventListener('click', (clicked) => { toggleFieldClass(clicked.target, '.class-attribute'); });

	document.querySelector('#select-roletype').onchange = function (e) {
		if (e.target.options[e.target.selectedIndex].value === 'group') {
			document.querySelector('#role-name').style.display = 'none';
			document.querySelector('#headline-role-type').innerHTML = 'Rollen-LDAP-Pfade';
		} else {
			document.querySelector('#role-name').style.display = 'block';
			document.querySelector('#headline-role-type').innerHTML = 'Rollen-Attribute';
		}
	};

	document.querySelector('#select-classes').onchange = function (e) {
		if(e.target.checked) {
			document.querySelector('.class-settings').style.display = 'block';
		} else {
			document.querySelector('.class-settings').style.display = 'none';
		}
	}

	document.querySelector('#select-roletype').dispatchEvent(new Event('change'));
	document.querySelector('#select-classes').dispatchEvent(new Event('change'));
});