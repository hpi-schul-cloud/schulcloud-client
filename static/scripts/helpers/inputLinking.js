/**
 * INPUT LINKING
 * usage: add the class ".linked" to the input field
 * and the attribute "data-from={inputname}" to the node
 * that should be updated with the value from the input field.
 * {inputname} is the value of the name attribute of the input field.
 */

function updateLinkedElements(event) {
	const source = event.target;
	let newValue;
	switch (source.tagName) {
		case 'INPUT':
			newValue = source.value;
			break;
		case 'SELECT':
			if (source.selectedIndex < 0) {
				newValue = '';
			} else if (source.dataset.linktext !== undefined) {
				newValue = source.options[source.selectedIndex].text;
			} else if (source.dataset.linkhtml !== undefined) {
				newValue = source.options[source.selectedIndex].innerHTML;
			} else {
				newValue = source.options[source.selectedIndex].value;
			}
			break;
		default:
			if (source.dataset.linkhtml !== undefined) {
				newValue = source.innerHTML;
			} else {
				newValue = source.text;
			}
			break;
	}
	document.querySelectorAll(`*[data-from=${source.getAttribute('name')}]`).forEach((changeTarget) => {
		if (changeTarget.tagName === 'INPUT') {
			changeTarget.value = newValue;
		} else {
			changeTarget.innerHTML = newValue;
		}
	});
}
if (!window.inputLinking) {
	window.inputLinking = () => {
		const links = document.querySelectorAll('.linked');
		links.addEventListener('change input keyup paste click', updateLinkedElements);
		links.forEach((node) => {
			node.dispatchEvent(new CustomEvent('input'));
		});
	};
	window.addEventListener('DOMContentLoaded', window.inputLinking);
}
