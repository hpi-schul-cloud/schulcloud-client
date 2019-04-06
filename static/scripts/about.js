async function initTimeline(selector, url) {
	const res = await fetch(url, {
		credentials: 'same-origin',
	});
	const googleTimelineData = await res.json();
	// eslint-disable-next-line no-undef
	TL.Timeline(selector, TL.ConfigFactory.googleFeedJSONtoTimelineJSON(googleTimelineData));
}

function changeButtonText() {
	const button = this;
	const hiddenSchools = document.querySelector(button.dataset.target);
	if (hiddenSchools.classList.contains('in')) {
		button.innerHTML = 'mehr anzeigen<i class="fa fa-angle-down" aria-hidden="true"></i>';
	} else {
		button.innerHTML = 'weniger anzeigen<i class="fa fa-angle-up" aria-hidden="true"></i>';
	}
}

window.addEventListener('load', () => {
	initTimeline('timeline-embed', '/about/timeline.json');
	document.querySelectorAll('.toggle-partner').forEach((button) => {
		button.addEventListener('click', changeButtonText);
	});
});
