function changeButtonText() {
	const button = this;
	const hiddenPartners = document.querySelector(button.dataset.target);
	if (hiddenPartners.classList.contains('in')) {
		button.innerHTML = `${$t('about.button.showMore')}<i class="fa fa-angle-down" aria-hidden="true"></i>`;
	} else {
		button.innerHTML = `${$t('about.button.showLess')}<i class="fa fa-angle-up" aria-hidden="true"></i>`;
	}
}

const initializeSectionToggles = (selector) => () => {
	let toggles = document.querySelectorAll(selector);
	toggles = [].slice.call(toggles); // IE 11 hack, forEach is not supported on nodeLists
	toggles.forEach((button) => {
		button.addEventListener('click', changeButtonText);
	});
};
window.addEventListener('load', initializeSectionToggles('.toggle-partner'));
