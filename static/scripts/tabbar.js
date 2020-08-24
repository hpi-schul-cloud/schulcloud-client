// jshint esversion: 6

const app = {
	tabs: {
		initialize() {
			if (document.querySelectorAll('.tabContainer').length) {
				const container = document.querySelectorAll('.tabContainer');

				for (let i = 0, l = container.length; i < l; i += 1) {
					app.tabs.contain.call(null, container[i]);
					app.tabs.setIndicatorWidth.call(null, container[i]);

					const tabs = container[i].querySelectorAll('.tabs .tab');

					for (let ii = 0, ll = tabs.length; ii < ll; ii += 1) {
						tabs[ii].addEventListener('click', function tabClickEvent() {
							if (!$(this).attr('href')) {
								app.tabs.setActiveTab.call(this);
							}
						}, false);
						tabs[ii].addEventListener('mousedown', (event) => {
							event.preventDefault();
						}, false);
					}
				}

				window.addEventListener('resize', () => {
					for (let i = 0, l = container.length; i < l; i += 1) {
						app.tabs.contain.call(null, container[i]);
						app.tabs.setIndicatorWidth.call(null, container[i]);
					}
				}, false);
			}
		},
		setIndicatorWidth(parent) {
			if (parent.querySelectorAll('.tabs div').length === 0) {
				parent.querySelector('.tabs').appendChild(document.createElement('div'));
				parent.querySelector('.tabs div').classList.add('indicator');
			}

			const indicator = parent.querySelector('.tabs .indicator');
			const containerRect = parent.querySelector('.tabs').getBoundingClientRect();
			const curTabRect = parent.querySelector('.tabs .tab.active').getBoundingClientRect();

			// left = left of active element minus left of parent container
			indicator.style.left = `${curTabRect.left - containerRect.left}px`;
			// right = parent container width minus width of active element plus left of active element
			// eslint-disable-next-line max-len
			indicator.style.right = `${(containerRect.left + containerRect.width) - (curTabRect.left + curTabRect.width)}px`;
		},
		setActiveTab(setHistory = true) {
			const indicator = this.parentElement.querySelector('.indicator');
			let parent = this;
			const newTab = this;
			const newTabSelector = this.getAttribute('data-tab');
			const newSection = document
				.querySelector(`.sectionsContainer .sections .section[data-section=${newTabSelector}]`);
			const oldSection = document.querySelector('.sectionsContainer .sections .section.active');

			while (!parent.classList.contains('tabs')) {
				parent = parent.parentElement;
			}

			const oldTab = parent.querySelector('.tab.active');
			const parentRect = parent.getBoundingClientRect();
			const newTabRect = newTab.getBoundingClientRect();
			const indicatorRect = indicator.getBoundingClientRect();

			if (indicatorRect.left < newTabRect.left) {
				// eslint-disable-next-line max-len
				indicator.style.right = `${(parentRect.left + parentRect.width) - (newTabRect.left + newTabRect.width)}px`;
				indicator.style.left = `${newTabRect.left - parentRect.left}px`;
			} else {
				indicator.style.left = `${newTabRect.left - parentRect.left}px`;
				// eslint-disable-next-line max-len
				indicator.style.right = `${(parentRect.left + parentRect.width) - (newTabRect.left + newTabRect.width)}px`;
			}

			oldTab.classList.remove('active');
			if (oldSection) {
				oldSection.classList.remove('active');
			}
			this.classList.add('active');
			if (newSection) {
				newSection.classList.add('active');
			}

			if (setHistory) {
				const params = new URLSearchParams(window.location.search);
				const baseUrl = window.location.href.split('?')[0];
				const lastChar = baseUrl[baseUrl.length - 1];
				params.delete('activeTab');
				params.set('activeTab', newTabSelector.replace('js-', ''));
				if (lastChar === '/') {
					window.history.pushState('', '', `?${params.toString()}`);
				} else {
					window.history.pushState('', '', `${baseUrl}/?${params.toString()}`);
				}
			}
		},
		setActiveTabByName(activeTabName) {
			let activeTab;
			if (activeTabName) {
				activeTab = document.querySelector(`.tabContainer .tabs .tab[data-tab=js-${activeTabName}]`);
			} else {
				activeTab = document.querySelector('.tabContainer').querySelector('.tabs .tab:first-child');
			}
			app.tabs.setActiveTab.call(activeTab, false);
		},
		// eslint-disable-next-line no-unused-vars
		contain(container) {

		},
	},
};

// detect when history buttons are pressed
window.addEventListener('popstate', () => {
	const params = new URLSearchParams(window.location.search);
	app.tabs.setActiveTabByName(params.get('activeTab'));
}, false);

document.addEventListener('DOMContentLoaded', () => {
	if (document.querySelectorAll('.tabContainer').length) {
		let activeTabName = document.querySelector('.tabContainer').getAttribute('data-active-tab');
		let activeTab;
		let activeSection;
		if (activeTabName) {
			activeTabName = `js-${activeTabName}`;
			activeTab = document.querySelector(`.tabContainer .tabs .tab[data-tab=${activeTabName}]`);
			activeSection = document
				.querySelector(`.sectionsContainer .sections .section[data-section=${activeTabName}]`);
		} else {
			activeTab = document.querySelector('.tabContainer').querySelector('.tabs .tab:first-child');
			activeSection = document.querySelector('.sectionsContainer')
				.querySelector('.sections .section:first-child');
		}
		if (activeTab) {
			activeTab.classList.add('active');
		}
		if (activeSection) {
			activeSection.classList.add('active');
		}
	}
	setTimeout(() => app.tabs.initialize(), 0);
}, false);
