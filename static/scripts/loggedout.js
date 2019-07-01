document.addEventListener('DOMContentLoaded', () => {
	const activeNavElement = document.querySelector(`.header [href="${window.location.pathname}"]`);
	if (!activeNavElement) {
		return;
	}
	activeNavElement.classList.add('active');
});
