function changeButtonText() {
	const button = this;
	const hiddenPartners = document.querySelector(button.dataset.target);
	if (hiddenPartners.classList.contains('in')) {
		button.innerHTML = 'mehr anzeigen<i class="fa fa-angle-down" aria-hidden="true"></i>';
	} else {
		button.innerHTML = 'weniger anzeigen<i class="fa fa-angle-up" aria-hidden="true"></i>';
	}
}

export const initializeSectionToggles = selector => () => {
	let toggles = document.querySelectorAll(selector);
	toggles = [].slice.call(toggles); // IE 11 hack, forEach is not supported on nodeLists
	toggles.forEach((button) => {
		button.addEventListener('click', changeButtonText);
	});
};

window.addEventListener('load', initializeSectionToggles('.toggle-partner'));

export default {};
