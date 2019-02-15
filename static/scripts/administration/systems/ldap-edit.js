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
			element.readOnly = false;
		} else {
			element.readOnly = true;
		}
	});
}

function toggleTableClass(clicked, tableID) {
	clicked.preventDefault();
	// Change viewing status of table
	if (clicked.target.innerText === 'Ausblenden') {
		clicked.target.innerText = 'Einblenden';
		document.querySelector(tableID).style.display = 'none';
	} else {
		clicked.target.innerText = 'Ausblenden';
		document.querySelector(tableID).style.display = 'block';
	}
}

function deleteTableRows(table) {
	const rowCount = table.rows.length;
	for (let i = rowCount - 1; i > 0; i--) {
		table.deleteRow(i);
	}
}

function activateLDAP(event) {
	event.preventDefault();

	let activeURL = window.location.href;
	activeURL = activeURL.replace('edit', 'activate');

	$.ajax({
		type: 'POST',
		url: activeURL,
		timeout: 10000, // sets timeout to 10 seconds
		error: function(){
			// will fire when timeout is reached
			$.showNotification("Zeitüberschreitung der Anwendung", "danger");
		},
		success: function (response) {
			window.location.replace(window.location.origin + '/administration/school');
		},
	});
}

function verifyLDAPData(event) {
	event.preventDefault();

	// Check for ldaps
	if (!document.querySelector('[name="ldapurl"]').value.startsWith('ldaps')) {
		return $.showNotification("LDAP ist nur über das sichere Protokoll ldaps möglich!", "danger");
	}

	$.ajax({
		type: 'POST',
		url: window.location.href,
		data: $('#ldap-form').serialize(),
		dataType: 'json',
		timeout: 10000, // sets timeout to 10 seconds
		error: function(){
			// will fire when timeout is reached
			$.showNotification("LDAP Zeitüberschreitung - Mögliche Gründe sind: falsche Server-Daten, Nicht offiziell signierte SSL Zertifikate (ldaps), flasche Nutzerdaten für den search-Nutzer, inkorrekter root-Pfad, inkorrekter Nutzer-Pfad, inkorrekter Klassen-Pfad oder inkorrekte Rollen-LDAP-Pfade. Sollten Sie das Problem nicht lösen können, kontaktieren Sie den Support.", "danger");
		
			// Make save button deactive
			document.querySelector('#savesubmit').disabled = true;
		},
		success: function (response) {
			// Find user table and empty all data
			const userTable = document.querySelector('#userTable');
			deleteTableRows(userTable);

			// Add user data to Verify table
			response.users.forEach(user => {
				const row = userTable.insertRow(userTable.rows.length);

				let currentCell = row.insertCell(0);
				currentCell.innerHTML = user.firstName;

				currentCell = row.insertCell(1);
				currentCell.innerHTML = user.lastName;

				currentCell = row.insertCell(2);
				currentCell.innerHTML = user.email;

				currentCell = row.insertCell(3);
				currentCell.innerHTML = user.ldapUID;

				currentCell = row.insertCell(4);
				currentCell.innerHTML = user.roles.join();

				currentCell = row.insertCell(5);
				currentCell.innerHTML = user.ldapDn;

				currentCell = row.insertCell(6);
				currentCell.innerHTML = user.ldapUUID;
			});

			// Find user table and empty all data
			const classTable = document.querySelector('#classTable');
			deleteTableRows(classTable);

			// Add user data to Verify table
			response.classes.forEach(singleClass => {
				const row = classTable.insertRow(classTable.rows.length);

				let currentCell = row.insertCell(0);
				currentCell.innerHTML = singleClass.className;

				currentCell = row.insertCell(1);
				currentCell.innerHTML = singleClass.ldapDn;

				currentCell = row.insertCell(2);
				currentCell.innerHTML = singleClass.uniqueMembers;
			});


			// Make tables visible
			document.querySelector('#verifyarea').style.display = 'block';

			// Make save button active
			document.querySelector('#savesubmit').disabled = false;
		},
	});
}

window.addEventListener('DOMContentLoaded', () => {
	// Activate fields
	document.querySelector('#user-section-toggle').addEventListener('click', (clicked) => { toggleFieldClass(clicked.target, '.user-attribute'); });
	document.querySelector('#role-section-toggle').addEventListener('click', (clicked) => { toggleFieldClass(clicked.target, '.role-attribute'); });
	document.querySelector('#class-section-toggle').addEventListener('click', (clicked) => { toggleFieldClass(clicked.target, '.class-attribute'); });

	// Button
	document.querySelector('#verify').addEventListener('click', (clicked) => {
		verifyLDAPData(clicked);
	});
	document.querySelector('#savesubmit').addEventListener('click', (clicked) => {
		activateLDAP(clicked);
	});

	// User overview tables
	document.querySelector('#usertoggle').addEventListener('click', (clicked) => { toggleTableClass(clicked, '#userTable'); });
	document.querySelector('#classtoggle').addEventListener('click', (clicked) => { toggleTableClass(clicked, '#classTable'); });

	// Interactive show/hide
	document.querySelector('#select-roletype').onchange = function (e) {
		if (e.target.options[e.target.selectedIndex].value === 'group') {
			document.querySelector('#role-name').style.display = 'none';
			document.querySelector('#headline-role-type').innerHTML = 'Rollen-LDAP-Pfade';
			document.querySelector('#description-role-attribute').setAttribute('title', 'Welche LDAP-Gruppe definiert die genannten Rolle? Geben Sie den vollen Pfad (inkl. root-Pfad) an');
		} else {
			document.querySelector('#role-name').style.display = 'block';
			document.querySelector('#headline-role-type').innerHTML = 'Rollen-Attribute';
			document.querySelector('#description-role-attribute').setAttribute('title', 'Welcher Wert in Ihrem zuvor definierten Rollen-Feld entspricht der genannten Rolle?');
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