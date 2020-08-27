// set this to false to disable validation between pages (for testing)
const ValidationDisabled = false;

function CustomEventPolyfill() {
	if (typeof window.CustomEvent === 'function') return false;
	function CustomEvent(event, orgParams) {
		const params = orgParams || { bubbles: false, cancelable: false, detail: null };
		const evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}
	window.CustomEvent = CustomEvent;
	return true;
}
CustomEventPolyfill();


/* HELPER */

if (!NodeList.prototype.indexOf) {
	NodeList.prototype.indexOf = Array.prototype.indexOf;
}
if (!NodeList.prototype.filter) {
	NodeList.prototype.filter = Array.prototype.filter;
}
if (!NodeList.prototype.some) {
	NodeList.prototype.some = Array.prototype.some;
}

/* MULTIPAGE INPUT FORM */

function getMaxSelectionIndex() {
	return document.querySelector('.stages').childElementCount;
}
function getSelectionIndex() {
	const radioButtons = document.querySelectorAll('.form input[type=radio]');
	const currentSelection = radioButtons.indexOf(radioButtons.filter((node) => node.checked)[0]) + 1;
	return currentSelection < 1 ? 1 : currentSelection;
}
function showInvalid(sectionNr) {
	document.querySelectorAll('form .panels > section[data-panel]')[sectionNr - 1].classList.add('show-invalid');
	window.scrollTo(0, 0);
}
function getSubmitPageIndex() {
	const sections = document.querySelectorAll('form .panels section');
	return sections.indexOf(document.querySelector('section.submit-page')) + 1;
}
function isSubmitted() {
	const form = document.querySelector('.form');
	return form ? form.classList.contains('form-submitted') : false;
}

function updateButton(selectedIndex) {
	const currentPage = document.querySelectorAll('form .panels > section[data-panel]')[selectedIndex - 1];
	const submitPage = currentPage.classList.contains('submit-page');
	let { nextLabel } = currentPage.dataset;
	if (!nextLabel) {
		if (submitPage) {
			nextLabel = document.querySelector('#nextSection').dataset.submitLabel;
		} else {
			const { nextLabel: nextPageLabel } = document.querySelector('#nextSection').dataset;
			nextLabel = nextPageLabel;
		}
	}
	document.querySelector('#nextSection').innerHTML = nextLabel;

	if (selectedIndex === getMaxSelectionIndex()) {
		document.querySelector('.form #nextSection').setAttribute('disabled', 'disabled');
		document.querySelector('.form #nextSection').classList.add('hidden');
	} else {
		document.querySelector('.form #nextSection').removeAttribute('disabled');
		document.querySelector('.form #nextSection').classList.remove('hidden');
	}

	const btnLogout = document.querySelector('.form #btn-logout');
	if (btnLogout) {
		btnLogout.classList[selectedIndex === 1 ? 'remove' : 'add']('hidden');
	}

	if (selectedIndex === 1 || selectedIndex === getSubmitPageIndex() + 1) {
		document.querySelector('.form #prevSection').setAttribute('disabled', 'disabled');
	} else {
		document.querySelector('.form #prevSection').removeAttribute('disabled');
	}

	window.scrollTo(0, 0);
}

function isSectionValid(sectionIndex) {
	if (ValidationDisabled) return true; // for testing only
	// negation is needed, because some() returns false on a blank array.
	const currentInputs = document.querySelectorAll(`section[data-panel="section-${sectionIndex}"] input`);
	return !currentInputs.some(input => !input.checkValidity());
}

function setSelectionByIndex(index, event) {
	if (event) {
		event.preventDefault();
	}
	function setSelection(newIndex) {
		const hideEvent = new CustomEvent('hideSection', {
			detail: {
				sectionIndex: getSelectionIndex(),
			},
		});
		document.querySelectorAll('form .panels > section[data-panel]')[getSelectionIndex() - 1]
			.dispatchEvent(hideEvent);

		document.querySelector(`.form input[type="radio"]:nth-of-type(${newIndex})`).checked = true;
		// set keyboard focus to first focusable element in the opened section.
		const nextSectionNode = document.querySelectorAll('form .panels > section[data-panel]')[newIndex - 1];
		const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
		const firstInput = nextSectionNode.querySelectorAll(focusableElements)[0];
		if (firstInput) {
			firstInput.focus();
		}

		updateButton(newIndex);

		const showEvent = new CustomEvent('showSection', {
			detail: { sectionIndex: newIndex },
		});
		nextSectionNode.dispatchEvent(showEvent);
	}

	function findLatestInvalid(to) {
		for (let i = 1; i <= to; i += 1) {
			if (!isSectionValid(i)) { return i; }
		}
		return to;
	}

	const submitPageIndex = getSubmitPageIndex();
	const submitted = isSubmitted();
	if (submitted) {
		if (index > submitPageIndex) {
			setSelection(index); // prevent resubmit -> pages before unreachable
		} else {
			setSelection(submitPageIndex + 1);
		}
	} else {
		const minIndex = Math.min(index, submitPageIndex); // prevent skip of submit
		const latestInvalid = findLatestInvalid(minIndex);
		if (latestInvalid >= minIndex) {
			setSelection(minIndex);
		} else {
			showInvalid(latestInvalid);
			setSelection(latestInvalid);
		}
	}
}

function submitForm(event) {
	if (this.checkValidity()) {
		event.preventDefault();
		const formSubmitButton = document.querySelector('#nextSection');
		formSubmitButton.disabled = true;
		$.ajax({
			url: this.getAttribute('action'),
			method: this.getAttribute('method'),
			data: $(this).serialize(),
			context: this,
		}).done((response) => {
			if (response.type !== undefined) {
				$.showNotification(response.message, response.type, response.time);
			}
			if (response.createdCourse) {
				$('#addclass-create-topic').attr('href', `/courses/${response.createdCourse._id}/topics/add`);
				$('#addclass-create-homework').attr('href', `/homework/new?course=${response.createdCourse._id}`);
			}
			document.querySelector('.form').classList.add('form-submitted');
			formSubmitButton.disabled = false;
			// go to next page
			setSelectionByIndex(getSelectionIndex() + 1, event);
		})
			.fail((response) => {
				if (response.responseText !== undefined) {
					$.showNotification(
						$t('dataprivacy.text.errorSubmittingForm', { text: response.responseText }),
						'danger',
						true,
					);
				} else {
					const errorMessage = $t('dataprivacy.text.errorSubmittingFormUndefined');
					$.showNotification(errorMessage, 'danger', true);
				}
				formSubmitButton.disabled = false;
			});
	} else {
		$.showNotification($t('dataprivacy.text.invalidForm'), 'danger', 6000);
	}
}

function nextSection(event) {
	// ValidationEnabled is for testing only
	const currentSection = document.querySelectorAll('form .panels > section[data-panel]')[getSelectionIndex() - 1];
	const isSubmitPage = ValidationDisabled ? false : currentSection.classList.contains('submit-page');
	if (ValidationDisabled) { document.querySelector('.form').classList.add('form-submitted'); }


	if (!isSubmitPage) {
		event.preventDefault();
		const selectedIndex = getSelectionIndex() + 1;
		setSelectionByIndex(selectedIndex, event);
	}
	// else: no reaction -> should submit
}
function prevSection(event) {
	if (getSelectionIndex() > 1) {
		const selectedIndex = getSelectionIndex() - 1;
		setSelectionByIndex(selectedIndex, event);
	}
}
function goToSection(event) {
	const selectedIndex = document.querySelectorAll('.form .stages label').indexOf(this) + 1;
	setSelectionByIndex(selectedIndex, event);
}
function handleKeyPress(event) {
	if (event.keyCode === 13) {
		$(this).click();
	}
}
window.addEventListener('DOMContentLoaded', () => {
	// Stepper
	// document.querySelectorAll('.form .stages label').addEventListener("click", goToSection);

	$('.form .stages label').on('click', goToSection);
	$('.form .stages label').on('keypress', handleKeyPress);
	const form = document.querySelector('.form');
	if (!form) {
		// eslint-disable-next-line no-console
		console.warn('.form not found');
		return;
	}
	form.addEventListener('submit', submitForm);

	const prevButton = form.querySelector('.form #prevSection');
	if (prevButton) {
		prevButton.addEventListener('click', prevSection);
	}
	const nextButton = form.querySelector('.form #nextSection');
	if (nextButton) {
		nextButton.addEventListener('click', nextSection);
	}
});
window.addEventListener('load', () => {
	if (document.querySelector('.form')) {
		// open first page to toggle show event.
		setSelectionByIndex(1);
	}
});
